/**
 * GET /api/xfeed/preferences
 * 
 * Get user's X Feed preferences (organizations, people, hashtags they follow)
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)

    const follows = await prisma.xFeedFollow.findMany({
      where: { workMeId: workMe.id },
      orderBy: [{ type: 'asc' }, { displayName: 'asc' }],
    })

    // Group by type
    const organizations = follows.filter((f) => f.type === 'organization').map((f) => ({
      displayName: f.displayName,
      handle: f.handle,
      verified: f.verified,
    }))
    const people = follows.filter((f) => f.type === 'person').map((f) => ({
      displayName: f.displayName,
      handle: f.handle,
      verified: f.verified,
    }))
    const hashtags = follows.filter((f) => f.type === 'hashtag').map((f) => ({
      displayName: f.displayName,
      handle: f.handle,
      verified: f.verified,
    }))

    return NextResponse.json({
      success: true,
      organizations,
      people,
      hashtags,
    })
  } catch (error: any) {
    console.error('❌ GET /api/xfeed/preferences error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load preferences' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/xfeed/preferences
 * 
 * Save user's X Feed preferences
 * Body: { organizations: string[], people: string[], hashtags: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)

    const body = await request.json()
    const { organizations = [], people = [], hashtags = [] } = body

    // Delete existing follows
    await prisma.xFeedFollow.deleteMany({
      where: { workMeId: workMe.id },
    })

    // Create new follows
    const followsToCreate = [
      ...organizations.map((org: string) => ({
        workMeId: workMe.id,
        type: 'organization' as const,
        displayName: org,
        handle: org.startsWith('@') ? org : `@${org}`,
        verified: false,
      })),
      ...people.map((person: string) => ({
        workMeId: workMe.id,
        type: 'person' as const,
        displayName: person,
        handle: person.startsWith('@') ? person : `@${person.replace(/\s+/g, '').toLowerCase()}`,
        verified: false,
      })),
      ...hashtags.map((hashtag: string) => ({
        workMeId: workMe.id,
        type: 'hashtag' as const,
        displayName: hashtag,
        handle: hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
        verified: false,
      })),
    ]

    if (followsToCreate.length > 0) {
      await prisma.xFeedFollow.createMany({
        data: followsToCreate,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
    })
  } catch (error: any) {
    console.error('❌ POST /api/xfeed/preferences error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save preferences' },
      { status: 500 }
    )
  }
}

