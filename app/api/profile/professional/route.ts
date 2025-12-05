import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/profile/professional
 * 
 * Get WorkProfile (professional identity - "What I Do")
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const workProfile = await prisma.workProfile.findUnique({
      where: { workMeId },
    })

    return NextResponse.json({
      success: true,
      workProfile: workProfile || null,
    })
  } catch (error: any) {
    console.error('❌ WorkProfileGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get work profile' },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/profile/professional
 * 
 * Update WorkProfile (professional metadata)
 */
export async function PUT(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { jobRole, industry, salaryRange, responsibilitySummary, seniority } = body

    // Upsert WorkProfile
    const workProfile = await prisma.workProfile.upsert({
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
        jobRole: jobRole !== undefined ? jobRole : undefined,
        industry: industry !== undefined ? industry : undefined,
        salaryRange: salaryRange !== undefined ? salaryRange : undefined,
        responsibilitySummary: responsibilitySummary !== undefined ? responsibilitySummary : undefined,
        seniority: seniority !== undefined ? seniority : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      workProfile,
    })
  } catch (error: any) {
    console.error('❌ WorkProfileUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update work profile' },
      { status: 500 },
    )
  }
}

