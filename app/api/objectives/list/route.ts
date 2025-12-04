import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/objectives/list
 * 
 * Get all objectives (goals) for current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Fetch all objectives for this user
    const objectives = await prisma.objective.findMany({
      where: { originatorId: workMeId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        howMeasured: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      objectives,
    })
  } catch (error: any) {
    console.error('❌ ObjectivesList error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list objectives', objectives: [] },
      { status: 500 },
    )
  }
}

