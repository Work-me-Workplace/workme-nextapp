import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/myskills
 * 
 * Get MySkills record for current authenticated user
 * Returns both raw and AI-enriched fields
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Fetch MySkills record
    const mySkills = await prisma.mySkills.findUnique({
      where: { workMeId },
    })

    if (!mySkills) {
      return NextResponse.json({
        success: true,
        mySkills: null,
      })
    }

    return NextResponse.json({
      success: true,
      mySkills,
    })
  } catch (error: any) {
    console.error('❌ MySkillsGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get skills' },
      { status: 500 },
    )
  }
}

