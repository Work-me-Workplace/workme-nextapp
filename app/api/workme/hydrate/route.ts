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
    const { id: workMeId, companyUnit, companyDivision } = workMe

    console.log('[API GET /api/workme/hydrate] Auth verified:', {
      workMeId,
      companyUnit,
      companyDivision,
      firebaseId,
    })

    // Fetch WorkMe with additional fields not in loadWorkMe
    const workMeRecord = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        companyUnit: true,
        companyDivision: true,
        jobTitle: true,
        specialty: true,
        industry: true,
        jobRole: true,
        salaryRange: true,
        createdAt: true,
      },
    })

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

    console.log('[API GET /api/workme/hydrate] Hydration successful:', {
      workMeId: workMeRecord.id,
      companyUnit: workMeRecord.companyUnit,
      companyDivision: workMeRecord.companyDivision,
    })

    return NextResponse.json({
      success: true,
      workMe: {
        id: workMeRecord.id,
        firebaseId: workMeRecord.firebaseId,
        email: workMeRecord.email,
        firstName: workMeRecord.firstName,
        lastName: workMeRecord.lastName,
        photoUrl: workMeRecord.photoUrl,
        companyUnit: workMeRecord.companyUnit,
        companyDivision: workMeRecord.companyDivision,
        jobTitle: workMeRecord.jobTitle,
        specialty: workMeRecord.specialty,
        industry: workMeRecord.industry,
        jobRole: workMeRecord.jobRole,
        salaryRange: workMeRecord.salaryRange,
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

