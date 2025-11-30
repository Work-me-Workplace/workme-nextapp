import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
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

    // Verify Firebase token and get authenticated context
    const { workMeId, companyUnit, companyDivision, firebaseId } = await verifyAuth(request)

    console.log('[API GET /api/workme/hydrate] Auth verified:', {
      workMeId,
      companyUnit,
      companyDivision,
      firebaseId,
    })

    // Fetch WorkMe
    const workMe = await prisma.workMe.findUnique({
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

    if (!workMe) {
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
      workMeId: workMe.id,
      companyUnit: workMe.companyUnit,
      companyDivision: workMe.companyDivision,
    })

    return NextResponse.json({
      success: true,
      workMe: {
        id: workMe.id,
        firebaseId: workMe.firebaseId,
        email: workMe.email,
        firstName: workMe.firstName,
        lastName: workMe.lastName,
        photoUrl: workMe.photoUrl,
        companyUnit: workMe.companyUnit,
        companyDivision: workMe.companyDivision,
        jobTitle: workMe.jobTitle,
        specialty: workMe.specialty,
        industry: workMe.industry,
        jobRole: workMe.jobRole,
        salaryRange: workMe.salaryRange,
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

