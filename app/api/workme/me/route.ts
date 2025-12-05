import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workme/me
 * 
 * Get current authenticated user's WorkMe profile
 * Returns WorkMe identity with photoUrl from Firebase
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify Firebase auth token (includes photoUrl)
    const { firebaseId, photoUrl, displayName } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Fetch WorkMe record
    const workMeRecord = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        headline: true,
        handle: true,
        title: true,
        linkedinUrl: true,
        createdAt: true,
      },
    })

    if (!workMeRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'WorkMe not found',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      workMe: {
        ...workMeRecord,
        photoUrl: photoUrl || null, // Always from Firebase
        displayName: displayName || null,
      },
    })
  } catch (error: any) {
    console.error('[API GET /api/workme/me] Error:', {
      error: error.message,
      stack: error.stack,
    })

    // Return 401 for auth errors, 500 for others
    const status = error.message.includes('Unauthorized') || error.message.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get current user',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}
