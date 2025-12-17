import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/linkedin/[id]
 * 
 * Get a specific LinkedIn post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Fetch LinkedIn post (ensure it belongs to user)
    const linkedInPost = await prisma.linkedInPost.findFirst({
      where: {
        id: params.id,
        workMeId,
      },
      include: {
        memo: true,
      },
    })

    if (!linkedInPost) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      linkedInPost,
    })
  } catch (error: any) {
    console.error('❌ LinkedInGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get post' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/linkedin/[id]
 * 
 * Update a LinkedIn post draft
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Parse request body
    const body = await request.json()
    const { title, content } = body

    // 4. Verify post belongs to user
    const existingPost = await prisma.linkedInPost.findFirst({
      where: {
        id: params.id,
        workMeId,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn post not found' },
        { status: 404 }
      )
    }

    // 5. Only allow updates to drafts or failed posts
    if (existingPost.status === 'POSTED') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit posted content' },
        { status: 400 }
      )
    }

    // 6. Update post
    const linkedInPost = await prisma.linkedInPost.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? (title?.trim() || null) : existingPost.title,
        content: content?.trim() || existingPost.content,
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
    console.error('❌ LinkedInUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/linkedin/[id]
 * 
 * Delete a LinkedIn post draft
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Verify post belongs to user
    const existingPost = await prisma.linkedInPost.findFirst({
      where: {
        id: params.id,
        workMeId,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn post not found' },
        { status: 404 }
      )
    }

    // 4. Only allow deletion of drafts
    if (existingPost.status === 'POSTED') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete posted content' },
        { status: 400 }
      )
    }

    // 5. Delete post
    await prisma.linkedInPost.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('❌ LinkedInDelete error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete post' },
      { status: 500 }
    )
  }
}
