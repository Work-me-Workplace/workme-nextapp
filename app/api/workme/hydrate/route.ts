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

    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    console.log('[API GET /api/workme/hydrate] Auth verified:', {
      workMeId,
      firebaseId,
    })

    // Fetch WorkMe, WorkProfile, and current WorkEntry
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
      console.error('[API GET /api/workme/hydrate] WorkMe not found:', workMeId)
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

    console.log('[API GET /api/workme/hydrate] Hydration successful:', {
      workMeId: workMeRecord.id,
      companyUnit,
      companyDivision,
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
        companyUnit,
        companyDivision,
        createdAt: workMeRecord.createdAt,
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

