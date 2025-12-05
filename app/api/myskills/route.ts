import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/myskills
 * 
 * Get WorkSkills record for current authenticated user
 * Returns both raw and professional fields
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Fetch WorkSkills record
    const workSkills = await prisma.workSkills.findUnique({
      where: { workMeId },
    }).catch((err: any) => {
      if (err.code === 'P2021') return null // Table doesn't exist
      throw err
    })

    if (!workSkills) {
      return NextResponse.json({
        success: true,
        mySkills: null, // Keep response key for backward compatibility
        workSkills: null,
      })
    }

    return NextResponse.json({
      success: true,
      mySkills: workSkills, // Backward compatibility
      workSkills,
    })
  } catch (error: any) {
    console.error('❌ WorkSkillsGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get skills' },
      { status: 500 },
    )
  }
}
