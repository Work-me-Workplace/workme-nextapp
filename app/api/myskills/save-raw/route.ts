import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/myskills/save-raw
 * 
 * Save raw user inputs for skills intelligence
 * Fields: mySkillsRaw → skillsRaw, myStrengthsRaw → strengthsRaw, myJobResponsibilitiesRaw → specialties
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    
    // 3. Get raw data from body (accept both old and new field names for backward compatibility)
    const body = await request.json()
    const {
      mySkillsRaw,
      myJobResponsibilitiesRaw,
      myStrengthsRaw,
      // New field names
      skillsRaw,
      strengthsRaw,
      specialties,
    } = body

    // 4. Map old field names to new field names
    const mappedSkillsRaw = skillsRaw !== undefined ? skillsRaw : mySkillsRaw
    const mappedStrengthsRaw = strengthsRaw !== undefined ? strengthsRaw : myStrengthsRaw
    const mappedSpecialties = specialties !== undefined ? specialties : myJobResponsibilitiesRaw

    // 5. Upsert WorkSkills with raw fields
    const workSkills = await prisma.workSkills.upsert({
      where: { workMeId },
      create: {
        workMeId,
        skillsRaw: mappedSkillsRaw || null,
        strengthsRaw: mappedStrengthsRaw || null,
        specialties: mappedSpecialties || null,
      },
      update: {
        skillsRaw: mappedSkillsRaw !== undefined ? (mappedSkillsRaw || null) : undefined,
        strengthsRaw: mappedStrengthsRaw !== undefined ? (mappedStrengthsRaw || null) : undefined,
        specialties: mappedSpecialties !== undefined ? (mappedSpecialties || null) : undefined,
      },
    }).catch((err: any) => {
      if (err.code === 'P2021') {
        throw new Error('WorkSkills table does not exist. Please run migrations.')
      }
      throw err
    })

    console.log('✅ Saved WorkSkills raw data:', workMeId)

    return NextResponse.json({
      success: true,
      mySkills: workSkills, // Backward compatibility
      workSkills,
    })
  } catch (error: any) {
    console.error('❌ WorkSkillsSaveRaw error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save skills' },
      { status: 500 },
    )
  }
}
