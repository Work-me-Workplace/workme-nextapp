import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workme/me
 * 
 * Get current authenticated user's WorkMe profile
 * Uses Firebase auth token to identify the user
 * 
 * Returns full WorkMe record with all profile fields
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/workme/me] Starting...')

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    console.log('[API GET /api/workme/me] Auth verified:', {
      workMeId,
      firebaseId,
    })

    // 3. Fetch WorkMe, WorkProfile, and current WorkEntry
    const [workMeRecord, profile, currentWorkEntry] = await Promise.all([
      prisma.workMe.findUnique({
        where: { id: workMeId },
        select: {
          id: true,
          firebaseId: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.workProfile.findUnique({
        where: { userId: workMeId },
      }),
      prisma.workEntry.findFirst({
        where: {
          userId: workMeId,
          endDate: null, // Current job
        },
        include: {
          companyUnit: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
        },
      }),
    ])

    if (!workMeRecord) {
      console.error('[API GET /api/workme/me] WorkMe not found:', workMeId)
      return NextResponse.json(
        {
          success: false,
          error: 'WorkMe not found',
        },
        { status: 404 },
      )
    }

    const companyUnit = currentWorkEntry?.companyUnit.name || null
    const companyDivision = currentWorkEntry?.division || null

    console.log('[API GET /api/workme/me] Success:', {
      workMeId: workMeRecord.id,
      email: workMeRecord.email,
    })

    return NextResponse.json({
      success: true,
      workMe: {
        id: workMeRecord.id,
        firebaseId: workMeRecord.firebaseId,
        email: workMeRecord.email,
        firstName: profile?.firstName || null,
        lastName: profile?.lastName || null,
        photoUrl: profile?.profileImage || null,
        headline: profile?.headline || null,
        currentRole: profile?.currentRole || null,
        handle: profile?.handle || null,
        linkedinUrl: profile?.linkedinUrl || null,
        companyUnit,
        companyDivision,
        createdAt: workMeRecord.createdAt,
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

