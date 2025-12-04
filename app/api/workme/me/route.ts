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

    // 3. Fetch full WorkMe record with all fields
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        jobTitle: true,
        specialty: true,
        industry: true,
        jobRole: true,
        salaryRange: true,
        companyUnit: true,
        companyDivision: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!workMe) {
      console.error('[API GET /api/workme/me] WorkMe not found:', workMeId)
      return NextResponse.json(
        {
          success: false,
          error: 'WorkMe not found',
        },
        { status: 404 },
      )
    }

    console.log('[API GET /api/workme/me] Success:', {
      workMeId: workMe.id,
      email: workMe.email,
    })

    return NextResponse.json({
      success: true,
      workMe,
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

