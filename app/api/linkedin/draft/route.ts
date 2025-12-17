import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/linkedin/draft
 * 
 * Create a new LinkedIn post draft
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
    const { memoId, title, content } = body

    // 4. Validate required fields
    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'content is required' },
        { status: 400 }
      )
    }

    // 5. If memoId provided, verify it belongs to user
    if (memoId) {
      const memo = await prisma.memo.findFirst({
        where: {
          id: memoId,
          workMeId,
        },
      })

      if (!memo) {
        return NextResponse.json(
          { success: false, error: 'Memo not found' },
          { status: 404 }
        )
      }
    }

    // 6. Create LinkedIn post draft
    const linkedInPost = await prisma.linkedInPost.create({
      data: {
        workMeId,
        memoId: memoId || null,
        title: title?.trim() || null,
        content: content.trim(),
        status: 'DRAFT',
      },
      include: {
        memo: true,
      },
    })

    return NextResponse.json({
      success: true,
      linkedInPost,
    })
  } catch (error: any) {
    console.error('❌ LinkedInDraft error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create draft' },
      { status: 500 }
    )
  }
}
