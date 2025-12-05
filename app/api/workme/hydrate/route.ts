import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/workme/hydrate
 * 
 * Hydrate WorkMe data after Firebase authentication
 * Called by AuthProvider on auth state change
 * 
 * Returns:
 * - workMe: Full WorkMe record with companyUnit and companyDivision
 */
export async function GET(request: Request) {
  try {
    console.log('[API GET /api/workme/hydrate] Starting hydration...')

    // 1. Auth - Verify Firebase token (includes photoUrl)
    const { firebaseId, photoUrl, displayName } = await verifyAuth(request)
    
    // 2. Load WorkMe identity - just the basic WorkMe object
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Fetch full WorkMe record to get headline, handle, title, linkedinUrl
    const workMe = await prisma.workMe.findUnique({
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

    if (!workMe) {
      throw new Error('WorkMe not found')
    }

    console.log('[API GET /api/workme/hydrate] Hydration successful:', {
      workMeId: workMe.id,
      firebaseId,
    })

    // Return WorkMe with Firebase photoUrl
    return NextResponse.json({
      success: true,
      workMe: {
        id: workMe.id,
        firebaseId: workMe.firebaseId,
        email: workMe.email,
        headline: workMe.headline || null,
        handle: workMe.handle || null,
        title: workMe.title || null,
        linkedinUrl: workMe.linkedinUrl || null,
        photoUrl: photoUrl || null, // Always from Firebase
        displayName: displayName || null,
        createdAt: workMe.createdAt,
      },
    })
  } catch (error: any) {
    console.error('[API GET /api/workme/hydrate] Error:', {
      error: error.message,
      stack: error.stack,
    })

    // Return 401 for auth errors, 500 for others
    const status = error.message.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to hydrate session',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

