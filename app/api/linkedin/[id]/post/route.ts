import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/linkedin/[id]/post
 * 
 * Post a LinkedIn draft to LinkedIn
 * 
 * NOTE: This is a placeholder implementation. Real LinkedIn API integration
 * requires OAuth setup and LinkedIn API credentials.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Await params
    const { id } = await params

    // 4. Verify post belongs to user
    const existingPost = await prisma.linkedInPost.findFirst({
      where: {
        id,
        workMeId,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn post not found' },
        { status: 404 }
      )
    }

    // 5. Verify post is a draft
    if (existingPost.status !== 'DRAFT' && existingPost.status !== 'FAILED') {
      return NextResponse.json(
        { success: false, error: 'Post has already been posted' },
        { status: 400 }
      )
    }

    // 6. Check LinkedIn connection
    const workMeWithLinkedIn = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: {
        linkedinUserId: true,
        linkedinAccessToken: true,
        linkedinTokenExpiresAt: true,
      },
    })

    if (!workMeWithLinkedIn?.linkedinUserId || !workMeWithLinkedIn?.linkedinAccessToken) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn not connected. Please connect LinkedIn first.' },
        { status: 401 }
      )
    }

    // 7. Check if token is expired
    const { isTokenExpired } = await import('@/lib/services/linkedinOAuth')
    if (isTokenExpired(workMeWithLinkedIn.linkedinTokenExpiresAt)) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn token expired. Please reconnect LinkedIn.' },
        { status: 401 }
      )
    }

    // 8. Post to LinkedIn API
    try {
      const { postToLinkedIn } = await import('@/lib/services/linkedinOAuth')
      const postResult = await postToLinkedIn(
        workMeWithLinkedIn.linkedinAccessToken,
        workMeWithLinkedIn.linkedinUserId,
        existingPost.content
      )

      // 9. Update post as POSTED
      const linkedInPost = await prisma.linkedInPost.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          linkedinPostUrn: postResult.id,
          errorMessage: null,
        },
        include: {
          memo: true,
        },
      })

      return NextResponse.json({
        success: true,
        linkedInPost,
        message: 'Post published to LinkedIn successfully',
      })
    } catch (apiError: any) {
      // 10. Mark as FAILED with error message
      const linkedInPost = await prisma.linkedInPost.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage: apiError.message || 'Failed to post to LinkedIn',
        },
        include: {
          memo: true,
        },
      })

      // If 401, suggest reconnection
      const isUnauthorized = apiError.message?.includes('401') || 
                            apiError.message?.toLowerCase().includes('unauthorized')

      return NextResponse.json({
        success: false,
        linkedInPost,
        error: apiError.message || 'Failed to post to LinkedIn',
        requiresReconnect: isUnauthorized,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ LinkedInPost error:', error)
    
    // Update post as FAILED
    try {
      const { id } = await params
      await prisma.linkedInPost.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage: error.message || 'Unknown error',
        },
      })
    } catch (updateError) {
      console.error('Failed to update post status:', updateError)
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post to LinkedIn' },
      { status: 500 }
    )
  }
}
