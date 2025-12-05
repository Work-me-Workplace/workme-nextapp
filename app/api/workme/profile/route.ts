import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workme/profile
 * 
 * Get current authenticated user's complete profile
 * Returns: WorkMe (identity), WorkProfile (professional), CompanyAffiliation, WorkSkills, WorkEntry list, WorkOutlook summary
 * 
 * NEVER throws when child objects don't exist - returns null instead
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - get Firebase user data (includes photoUrl)
    const { firebaseId, photoUrl, displayName } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Load all modules in parallel - handle table not existing gracefully
    const [workMeRecord, workProfile, companyAffiliation, workSkills, workEntries, workOutlookItems] = await Promise.all([
      // WorkMe (identity) - always exists
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
      }).catch((err: any) => {
        console.error('Failed to load WorkMe:', err)
        throw err // WorkMe must exist
      }),
      
      // WorkProfile (professional identity) - may not exist
      prisma.workProfile.findUnique({
        where: { workMeId },
      }).catch((err: any) => {
        if (err.code === 'P2021') return null // Table doesn't exist
        console.error('Failed to load WorkProfile:', err)
        return null
      }),
      
      // CompanyAffiliation - may not exist
      prisma.companyAffiliation.findUnique({
        where: { workMeId },
        include: {
          company: { select: { id: true, name: true } },
          division: { select: { id: true, name: true } },
        },
      }).catch((err: any) => {
        if (err.code === 'P2021') return null // Table doesn't exist
        console.error('Failed to load CompanyAffiliation:', err)
        return null
      }),
      
      // WorkSkills - may not exist
      prisma.workSkills.findUnique({
        where: { workMeId },
      }).catch((err: any) => {
        if (err.code === 'P2021') return null // Table doesn't exist
        console.error('Failed to load WorkSkills:', err)
        return null
      }),
      
      // WorkEntry list - may not exist
      prisma.workEntry.findMany({
        where: { workMeId },
        orderBy: [
          { endDate: 'desc' }, // Current jobs first (endDate = null)
          { startDate: 'desc' },
        ],
      }).catch((err: any) => {
        if (err.code === 'P2021') return [] // Table doesn't exist
        console.error('Failed to load WorkEntry:', err)
        return []
      }),
      
      // WorkOutlook summary (recent items) - may not exist
      prisma.workOutlookItem.findMany({
        where: { workMeId },
        orderBy: { date: 'desc' },
        take: 10,
      }).catch((err: any) => {
        if (err.code === 'P2021') return [] // Table doesn't exist
        console.error('Failed to load WorkOutlookItem:', err)
        return []
      }),
    ])

    if (!workMeRecord) {
      return NextResponse.json(
        { success: false, error: 'WorkMe not found' },
        { status: 404 },
      )
    }

    // 4. Build response structure
    return NextResponse.json({
      success: true,
      workMe: {
        ...workMeRecord,
        photoUrl: photoUrl || null, // Always include Firebase photoUrl
        displayName: displayName || null,
      },
      workProfile: workProfile || null,
      companyAffiliation: companyAffiliation ? {
        id: companyAffiliation.id,
        workMeId: companyAffiliation.workMeId,
        companyUnit: companyAffiliation.company || null,
        divisionUnit: companyAffiliation.division || null,
      } : null,
      skills: workSkills || null,
      workEntries: workEntries || [],
      outlook: workOutlookItems || [],
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
 * Update WorkMe identity fields ONLY (headline, handle, title, linkedinUrl)
 * Update WorkProfile professional fields ONLY (jobRole, industry, salaryRange, responsibilitySummary, seniority)
 * 
 * Does NOT update:
 * - CompanyAffiliation (use /api/company-affiliation/save)
 * - WorkSkills (use /api/workskills)
 * - WorkEntry (use /api/workhistory)
 */
export async function PUT(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { 
      // WorkMe identity fields
      headline, 
      handle, 
      title, 
      linkedinUrl,
      // WorkProfile professional fields
      jobRole,
      industry,
      salaryRange,
      responsibilitySummary,
      seniority,
    } = body

    // Validate handle if provided
    if (handle !== undefined && handle !== null && handle.trim()) {
      // Check if handle is unique (if different from current)
      const existing = await prisma.workMe.findFirst({
        where: {
          handle: handle.trim(),
          id: { not: workMeId },
        },
      })
      
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Handle already taken. Please choose a different username.' },
          { status: 400 },
        )
      }
    }

    // Update WorkMe identity fields
    const updatedWorkMe = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        headline: headline !== undefined ? (headline || null) : undefined,
        handle: handle !== undefined ? (handle?.trim() || null) : undefined,
        title: title !== undefined ? (title || null) : undefined,
        linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl || null) : undefined,
      },
    })

    // Update WorkProfile professional fields (if any provided)
    let updatedWorkProfile = null
    if (jobRole !== undefined || industry !== undefined || salaryRange !== undefined || 
        responsibilitySummary !== undefined || seniority !== undefined) {
      try {
        updatedWorkProfile = await prisma.workProfile.upsert({
          where: { workMeId },
          create: {
            workMeId,
            jobRole: jobRole || null,
            industry: industry || null,
            salaryRange: salaryRange || null,
            responsibilitySummary: responsibilitySummary || null,
            seniority: seniority || null,
          },
          update: {
            jobRole: jobRole !== undefined ? (jobRole || null) : undefined,
            industry: industry !== undefined ? (industry || null) : undefined,
            salaryRange: salaryRange !== undefined ? (salaryRange || null) : undefined,
            responsibilitySummary: responsibilitySummary !== undefined ? (responsibilitySummary || null) : undefined,
            seniority: seniority !== undefined ? (seniority || null) : undefined,
          },
        })
      } catch (err: any) {
        // If table doesn't exist, just skip WorkProfile update
        if (err.code !== 'P2021') {
          throw err
        }
      }
    }

    return NextResponse.json({
      success: true,
      workMe: updatedWorkMe,
      workProfile: updatedWorkProfile,
    })
  } catch (error: any) {
    console.error('❌ WorkMeProfileUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 },
    )
  }
}
