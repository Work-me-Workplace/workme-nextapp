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

/**
 * PUT /api/workme/me
 * 
 * Update WorkMe identity fields (headline, handle, title, linkedinUrl)
 */
export async function PUT(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    
    const body = await request.json()
    const { headline, handle, title, linkedinUrl } = body

    // Get current WorkMe to check handle uniqueness
    const currentWorkMe = await prisma.workMe.findUnique({
      where: { firebaseId },
    })

    if (!currentWorkMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe not found' },
        { status: 404 },
      )
    }

    // Validate handle if provided
    if (handle !== undefined && handle !== null && handle.trim()) {
      // Check if handle is unique (if different from current)
      if (handle.trim() !== currentWorkMe.handle) {
        const existing = await prisma.workMe.findFirst({
          where: {
            handle: handle.trim(),
            id: { not: currentWorkMe.id },
          },
        })
        
        if (existing) {
          return NextResponse.json(
            { success: false, error: 'Handle already taken. Please choose a different username.' },
            { status: 400 },
          )
        }
      }
    }

    // Update WorkMe identity fields
    const updatedWorkMe = await prisma.workMe.update({
      where: { id: currentWorkMe.id },
      data: {
        headline: headline !== undefined ? (headline || null) : undefined,
        handle: handle !== undefined ? (handle?.trim() || null) : undefined,
        title: title !== undefined ? (title || null) : undefined,
        linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl || null) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      workMe: updatedWorkMe,
    })
  } catch (error: any) {
    console.error('[API PUT /api/workme/me] Error:', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update profile',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
