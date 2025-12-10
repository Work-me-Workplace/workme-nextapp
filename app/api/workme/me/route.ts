import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workme/me
 * 
 * Returns the FULL WorkMe object with all nested relations.
 * This is the identity hydration endpoint - called once on initial load.
 * Store the result in localStorage and use getWorkMe() client helper afterward.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify Firebase auth token (includes photoUrl)
    const { firebaseId, photoUrl, displayName } = await verifyAuth(request as Request)
    
    // 2. Fetch FULL WorkMe record with all nested relations
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      include: {
        workProfile: true,
        workSkills: true,
        workEntries: {
          orderBy: {
            startDate: 'desc',
          },
        },
        workGoals: {
          orderBy: {
            targetDate: 'asc',
          },
        },
        workplaces: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ecosystemCompanies: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
        ecosystemContacts: {
          include: {
            person: {
      select: {
        id: true,
                fullName: true,
                xHandle: true,
        title: true,
              },
            },
          },
        },
        workOpsOutlook: {
          include: {
            items: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        companyProducts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        externalCompanyPressures: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!workMe) {
      return NextResponse.json(
        {
          success: false,
          error: 'WorkMe not found',
        },
        { status: 404 },
      )
    }

    // 3. Return full WorkMe object with Firebase photoUrl/displayName added
    // companyId is a simple field (no relations included)
    const response = {
      ...workMe,
      photoUrl: photoUrl || null, // From Firebase
      displayName: displayName || null, // From Firebase
    }

    return NextResponse.json({
      success: true,
      workMe: response,
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
