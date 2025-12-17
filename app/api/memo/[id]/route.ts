import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/memo/[id]
 * 
 * Get a specific memo by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Await params
    const { id } = await params

    // 4. Fetch memo (ensure it belongs to user)
    const memo = await prisma.memo.findFirst({
      where: {
        id,
        workMeId,
      },
      include: {
        linkedInPosts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!memo) {
      return NextResponse.json(
        { success: false, error: 'Memo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      memo,
    })
  } catch (error: any) {
    console.error('❌ MemoGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get memo' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/memo/[id]
 * 
 * Update a memo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Await params
    const { id } = await params

    // 4. Parse request body
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

    // 5. Verify memo belongs to user
    const existingMemo = await prisma.memo.findFirst({
      where: {
        id,
        workMeId,
      },
    })

    if (!existingMemo) {
      return NextResponse.json(
        { success: false, error: 'Memo not found' },
        { status: 404 }
      )
    }

    // 6. Update memo
    const memo = await prisma.memo.update({
      where: { id },
      data: {
        whatHappened: whatHappened?.trim() || existingMemo.whatHappened,
        whySpecial: whySpecial !== undefined ? (whySpecial?.trim() || null) : existingMemo.whySpecial,
        myRole: myRole !== undefined ? (myRole?.trim() || null) : existingMemo.myRole,
        impact: impact !== undefined ? (impact?.trim() || null) : existingMemo.impact,
        thoughts: thoughts !== undefined ? (thoughts?.trim() || null) : existingMemo.thoughts,
        contextType: contextType || existingMemo.contextType,
        happenedAt: happenedAt ? new Date(happenedAt) : existingMemo.happenedAt,
      },
    })

    return NextResponse.json({
      success: true,
      memo,
    })
  } catch (error: any) {
    console.error('❌ MemoUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update memo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/memo/[id]
 * 
 * Delete a memo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Await params
    const { id } = await params

    // 4. Verify memo belongs to user
    const existingMemo = await prisma.memo.findFirst({
      where: {
        id,
        workMeId,
      },
    })

    if (!existingMemo) {
      return NextResponse.json(
        { success: false, error: 'Memo not found' },
        { status: 404 }
      )
    }

    // 5. Delete memo (LinkedInPosts will be set to null via onDelete: SetNull)
    await prisma.memo.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('❌ MemoDelete error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete memo' },
      { status: 500 }
    )
  }
}
