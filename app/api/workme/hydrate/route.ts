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
 * - workMe: Full WorkMe record
 */
export async function GET(request: Request) {
  try {
    console.log('[API GET /api/workme/hydrate] Starting hydration...')

    // 1. Auth - Verify Firebase token (includes photoUrl)
    const { firebaseId, photoUrl, displayName } = await verifyAuth(request)
    
    // 2. Fetch full WorkMe record (same as /api/workme/me)
    // This endpoint is kept for backward compatibility but should use /api/workme/me
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
      throw new Error('WorkMe not found')
    }

    // Return full WorkMe object with Firebase photoUrl/displayName
    // companyId is a simple field (no relations included)
    return NextResponse.json({
      success: true,
      workMe: {
        ...workMe,
        photoUrl: photoUrl || null,
        displayName: displayName || null,
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

