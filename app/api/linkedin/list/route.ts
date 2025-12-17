import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/linkedin/list
 * 
 * Get all LinkedIn posts for current authenticated user
 * Ordered by createdAt (most recent first)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const memoId = searchParams.get('memoId')

    // 4. Build where clause
    const where: any = { workMeId }
    if (status) {
      where.status = status
    }
    if (memoId) {
      where.memoId = memoId
    }

    // 5. Fetch all LinkedIn posts for this user
    const linkedInPosts = await prisma.linkedInPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        memo: true,
      },
    })

    return NextResponse.json({
      success: true,
      linkedInPosts,
    })
  } catch (error: any) {
    console.error('❌ LinkedInList error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list posts', linkedInPosts: [] },
      { status: 500 }
    )
  }
}
