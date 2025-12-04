import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/myskills/save-raw
 * 
 * Save raw user inputs for skills intelligence
 * Fields: mySkillsRaw, myJobResponsibilitiesRaw, myStrengthsRaw
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Get raw data from body
    const body = await request.json()
    const {
      mySkillsRaw,
      myJobResponsibilitiesRaw,
      myStrengthsRaw,
    } = body

    // 4. Upsert MySkills with raw fields
    const mySkills = await prisma.mySkills.upsert({
      where: { workMeId },
      create: {
        workMeId,
        mySkillsRaw: mySkillsRaw || null,
        myJobResponsibilitiesRaw: myJobResponsibilitiesRaw || null,
        myStrengthsRaw: myStrengthsRaw || null,
      },
      update: {
        mySkillsRaw: mySkillsRaw !== undefined ? mySkillsRaw : undefined,
        myJobResponsibilitiesRaw: myJobResponsibilitiesRaw !== undefined ? myJobResponsibilitiesRaw : undefined,
        myStrengthsRaw: myStrengthsRaw !== undefined ? myStrengthsRaw : undefined,
      },
    })

    console.log('✅ Saved MySkills raw data:', workMeId)

    return NextResponse.json({
      success: true,
      mySkills,
    })
  } catch (error: any) {
    console.error('❌ MySkillsSaveRaw error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save skills' },
      { status: 500 },
    )
  }
}

