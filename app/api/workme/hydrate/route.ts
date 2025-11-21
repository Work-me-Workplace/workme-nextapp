import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/workme/hydrate
 * 
 * Hydrate WorkMe + Company data after Firebase authentication
 * Called by AuthProvider on auth state change
 * 
 * Returns:
 * - workMe: Full WorkMe record
 * - company: Company record (if user belongs to one)
 */
export async function GET(request: Request) {
  try {
    console.log('[API GET /api/workme/hydrate] Starting hydration...')

    // Verify Firebase token and get authenticated context
    const { workMeId, companyId, firebaseId } = await verifyAuth(request)

    console.log('[API GET /api/workme/hydrate] Auth verified:', {
      workMeId,
      companyId,
      firebaseId,
    })

    // Fetch WorkMe with company relation
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
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

    // Guard: Warn if companyId is missing (Phase 2 will enforce)
    if (!workMe.companyId) {
      console.warn('[API GET /api/workme/hydrate] WARNING: User does not belong to a company:', workMeId)
    }

    console.log('[API GET /api/workme/hydrate] Hydration successful:', {
      workMeId: workMe.id,
      companyId: workMe.companyId,
      hasCompany: !!workMe.company,
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
        companyId: workMe.companyId,
        jobTitle: workMe.jobTitle,
        specialty: workMe.specialty,
        industry: workMe.industry,
        jobRole: workMe.jobRole,
        salaryRange: workMe.salaryRange,
        createdAt: workMe.createdAt,
      },
      company: workMe.company,
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

