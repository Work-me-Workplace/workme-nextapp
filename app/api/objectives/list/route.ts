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
    // Try Objective model first (WorkWorld architecture), fallback to WorkGoal (WorkMe architecture)
    let objectives: any[] = []
    
    try {
      objectives = await prisma.objective.findMany({
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
    } catch (err: any) {
      // If Objective table doesn't exist, try WorkGoal
      if (err.code === 'P2021') {
        try {
          const workGoals = await prisma.workGoal.findMany({
            where: { workMeId },
            orderBy: { targetDate: 'asc' },
            select: {
              id: true,
              goal: true,
              targetDate: true,
              createdAt: true,
            },
          })
          // Map WorkGoal to Objective format for compatibility
          objectives = workGoals.map(g => ({
            id: g.id,
            title: g.goal,
            description: null,
            howMeasured: null,
            createdAt: g.createdAt,
          }))
        } catch (goalErr: any) {
          // If WorkGoal also doesn't exist, return empty array
          if (goalErr.code !== 'P2021') {
            throw goalErr
          }
        }
      } else {
        throw err
      }
    }

    return NextResponse.json({
      success: true,
      objectives: objectives || [],
    })
  } catch (error: any) {
    console.error('❌ ObjectivesList error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list objectives', objectives: [] },
      { status: 500 },
    )
  }
}

