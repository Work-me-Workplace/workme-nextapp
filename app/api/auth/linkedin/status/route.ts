import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/server/verifyAuth';
import { loadWorkMe } from '@/lib/auth/loadWorkMe';
import { prisma } from '@/lib/prisma';
import { isTokenExpired } from '@/lib/services/linkedinOAuth';

/**
 * GET /api/auth/linkedin/status
 * 
 * Check LinkedIn connection status for current user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request);
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId);
    const { id: workMeId } = workMe;

    // 3. Fetch LinkedIn connection status
    const workMeData = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: {
        linkedinUserId: true,
        linkedinAccessToken: true,
        linkedinTokenExpiresAt: true,
      },
    });

    const isConnected = !!(
      workMeData?.linkedinUserId && 
      workMeData?.linkedinAccessToken
    );

    const isExpired = isConnected && isTokenExpired(workMeData?.linkedinTokenExpiresAt || null);

    return NextResponse.json({
      success: true,
      connected: isConnected && !isExpired,
      expired: isExpired,
      linkedinUserId: workMeData?.linkedinUserId || null,
      expiresAt: workMeData?.linkedinTokenExpiresAt || null,
    });
  } catch (error: any) {
    console.error('❌ LinkedIn status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check LinkedIn status' },
      { status: 500 }
    );
  }
}

