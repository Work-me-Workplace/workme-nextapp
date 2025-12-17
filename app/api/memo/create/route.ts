import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/memo/create
 * 
 * Create a new memo (work moment capture)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Parse request body
    const body = await request.json()
    const {
      whatHappened,
      whySpecial,
      myRole,
      impact,
      thoughts,
      contextType,
      happenedAt,
    } = body

    // 4. Validate required fields
    if (!whatHappened || !whatHappened.trim()) {
      return NextResponse.json(
        { success: false, error: 'whatHappened is required' },
        { status: 400 }
      )
    }

    // 5. Create memo
    const memo = await prisma.memo.create({
      data: {
        workMeId,
        whatHappened: whatHappened.trim(),
        whySpecial: whySpecial?.trim() || null,
        myRole: myRole?.trim() || null,
        impact: impact?.trim() || null,
        thoughts: thoughts?.trim() || null,
        contextType: contextType || 'OTHER',
        happenedAt: happenedAt ? new Date(happenedAt) : new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      memo,
    })
  } catch (error: any) {
    console.error('❌ MemoCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create memo' },
      { status: 500 }
    )
  }
}
