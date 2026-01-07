import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  exchangeCodeForToken,
  getLinkedInUserId,
} from '@/lib/services/linkedinOAuth';

/**
 * GET /api/auth/linkedin/callback
 * 
 * LinkedIn OAuth callback handler
 * Exchanges authorization code for access token and stores credentials
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (request.nextUrl.origin || 'http://localhost:3000');

  try {
    // 1. Extract OAuth callback parameters
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const error = request.nextUrl.searchParams.get('error');

    // 2. Handle OAuth errors
    if (error) {
      console.error('❌ LinkedIn OAuth error:', error);
      return NextResponse.redirect(
        `${appUrl}/mywork/linkedin?error=${encodeURIComponent(error)}`
      );
    }

    // 3. Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/mywork/linkedin?error=invalid_oauth_callback`
      );
    }

    // 4. Decode state to extract workMeId
    let workMeId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      workMeId = stateData.workMeId;

      // Validate state timestamp (prevent replay attacks)
      if (stateData.ts && Date.now() - stateData.ts > 10 * 60 * 1000) {
        return NextResponse.redirect(
          `${appUrl}/mywork/linkedin?error=state_expired`
        );
      }
    } catch (err) {
      console.error('❌ Invalid state parameter:', err);
      return NextResponse.redirect(
        `${appUrl}/mywork/linkedin?error=invalid_state`
      );
    }

    if (!workMeId) {
      return NextResponse.redirect(
        `${appUrl}/mywork/linkedin?error=missing_workme_context`
      );
    }

    // 5. Get redirect URI
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    if (!redirectUri) {
      return NextResponse.redirect(
        `${appUrl}/mywork/linkedin?error=server_configuration_error`
      );
    }

    // 6. Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(code, redirectUri);

    // 7. Fetch LinkedIn user ID
    const linkedinUserId = await getLinkedInUserId(tokenData.access_token);

    // 8. Calculate token expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // 9. Store LinkedIn credentials on WorkMe
    await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        linkedinUserId,
        linkedinAccessToken: tokenData.access_token,
        linkedinTokenExpiresAt: expiresAt,
      },
    });

    console.log('✅ LinkedIn OAuth connected for WorkMe:', workMeId);

    // 10. Redirect back to app with success
    return NextResponse.redirect(
      `${appUrl}/mywork/linkedin?linkedinConnected=true`
    );
  } catch (error: any) {
    console.error('❌ LinkedIn OAuth callback error:', error);
    return NextResponse.redirect(
      `${appUrl}/mywork/linkedin?error=${encodeURIComponent(error.message || 'callback_failed')}`
    );
  }
}

