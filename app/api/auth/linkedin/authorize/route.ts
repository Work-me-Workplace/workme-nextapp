import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/verifyAuth';
import { loadWorkMe } from '@/lib/auth/loadWorkMe';
import { getLinkedInAuthUrl } from '@/lib/services/linkedinOAuth';

/**
 * GET /api/auth/linkedin/authorize
 * 
 * Initiates LinkedIn OAuth flow
 * Redirects user to LinkedIn authorization page
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request);
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId);
    const { id: workMeId } = workMe;

    // 3. Get redirect URI
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    if (!redirectUri) {
      return NextResponse.json(
        { success: false, error: 'LINKEDIN_REDIRECT_URI not configured' },
        { status: 500 }
      );
    }

    // 4. Create state parameter (CSRF protection + workMeId)
    const state = Buffer.from(
      JSON.stringify({
        workMeId,
        ts: Date.now(),
      })
    ).toString('base64');

    // 5. Generate LinkedIn authorization URL
    const authUrl = getLinkedInAuthUrl(redirectUri, state);

    // 6. Redirect to LinkedIn
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('❌ LinkedIn authorize error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate LinkedIn OAuth' },
      { status: 500 }
    );
  }
}

