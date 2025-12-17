import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/memo/list
 * 
 * Get all memos for current authenticated user
 * Ordered by happenedAt (most recent first)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Fetch all memos for this user
    const memos = await prisma.memo.findMany({
      where: { workMeId },
      orderBy: { happenedAt: 'desc' },
      include: {
        _count: {
          select: { linkedInPosts: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      memos,
    })
  } catch (error: any) {
    console.error('❌ MemoList error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list memos', memos: [] },
      { status: 500 }
    )
  }
}
