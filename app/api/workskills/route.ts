import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workskills
 * 
 * Get WorkSkills for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const workSkills = await prisma.workSkills.findUnique({
      where: { workMeId },
    })

    return NextResponse.json({
      success: true,
      workSkills: workSkills || null,
    })
  } catch (error: any) {
    console.error('❌ WorkSkillsGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get work skills' },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/workskills
 * 
 * Update WorkSkills
 */
export async function PUT(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { skillsRaw, strengthsRaw, specialties, certifications } = body

    const workSkills = await prisma.workSkills.upsert({
      where: { workMeId },
      create: {
        workMeId,
        skillsRaw: skillsRaw || null,
        strengthsRaw: strengthsRaw || null,
        specialties: specialties || null,
        certifications: certifications || null,
      },
      update: {
        skillsRaw: skillsRaw !== undefined ? skillsRaw : undefined,
        strengthsRaw: strengthsRaw !== undefined ? strengthsRaw : undefined,
        specialties: specialties !== undefined ? specialties : undefined,
        certifications: certifications !== undefined ? certifications : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      workSkills,
    })
  } catch (error: any) {
    console.error('❌ WorkSkillsUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update work skills' },
      { status: 500 },
    )
  }
}

