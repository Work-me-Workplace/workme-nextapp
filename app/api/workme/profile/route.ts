import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workme/profile
 * 
 * Get current authenticated user's complete profile
 * Returns: WorkMe (identity), WorkProfile (professional), CompanyAffiliation, WorkSkills, WorkEntry list, WorkOutlook summary
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - get Firebase user data
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Load all modules in parallel
    const [workMeRecord, workProfile, companyAffiliation, workSkills, workEntries, workOutlookItems, workGoals] = await Promise.all([
      // WorkMe (identity)
      prisma.workMe.findUnique({
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
      }),
      // WorkProfile (professional identity)
      prisma.workProfile.findUnique({
        where: { workMeId },
      }).catch(() => null),
      // CompanyAffiliation
      prisma.companyAffiliation.findUnique({
        where: { workMeId },
        include: {
          company: { select: { id: true, name: true } },
          division: { select: { id: true, name: true } },
        },
      }).catch(() => null),
      // WorkSkills
      prisma.workSkills.findUnique({
        where: { workMeId },
      }).catch(() => null),
      // WorkEntry list
      prisma.workEntry.findMany({
        where: { workMeId },
        orderBy: [
          { endDate: 'desc' }, // Current jobs first (endDate = null)
          { startDate: 'desc' },
        ],
      }).catch(() => []),
      // WorkOutlook summary (recent items)
      prisma.workOutlookItem.findMany({
        where: { workMeId },
        orderBy: { date: 'desc' },
        take: 10,
      }).catch(() => []),
      // WorkGoals
      prisma.workGoal.findMany({
        where: { workMeId },
        orderBy: { targetDate: 'asc' },
      }).catch(() => []),
    ])

    return NextResponse.json({
      success: true,
      workMe: workMeRecord,
      workProfile: workProfile || null,
      companyAffiliation: companyAffiliation || null,
      workSkills: workSkills || null,
      workEntries: workEntries || [],
      workOutlookItems: workOutlookItems || [],
      workGoals: workGoals || [],
    })
  } catch (error: any) {
    console.error('❌ WorkMeProfileGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get profile' },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/workme/profile
 * 
 * Update WorkMe identity fields only (headline, handle, title, linkedinUrl)
 */
export async function PUT(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { headline, handle, title, linkedinUrl } = body

    // Update WorkMe identity fields only
    const updated = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        headline: headline !== undefined ? headline : undefined,
        handle: handle !== undefined ? handle : undefined,
        title: title !== undefined ? title : undefined,
        linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      workMe: updated,
    })
  } catch (error: any) {
    console.error('❌ WorkMeProfileUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 },
    )
  }
}
