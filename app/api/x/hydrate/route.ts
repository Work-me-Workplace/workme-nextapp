/**
 * POST /api/x/hydrate
 * 
 * Hydrate an EcosystemPerson with fresh data from X
 * Fetches profile metadata and recent tweets
 * 
 * Body: {
 *   personId: string
 *   handle?: string (optional, if personId lookup fails)
 *   xUserId?: string (optional, if personId lookup fails)
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Tweet {
  id: string
  text: string
  createdAt: string
  retweetCount: number
  likeCount: number
  replyCount: number
}

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)

    const body = await request.json()
    const { personId, handle, xUserId } = body

    if (!personId) {
      return NextResponse.json(
        { success: false, error: 'personId is required' },
        { status: 400 }
      )
    }

    // Get person from database
    const person = await prisma.ecosystemPerson.findUnique({
      where: { id: personId },
    })

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      )
    }

    // Verify this person is in the user's contacts
    const contact = await prisma.myEcosystemContact.findUnique({
      where: {
        workMeId_personId: {
          workMeId: workMe.id,
          personId: person.id,
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Person not in your contacts' },
        { status: 403 }
      )
    }

    // Get X API credentials
    const bearerToken = process.env.X_BEARER_TOKEN
    if (!bearerToken) {
      return NextResponse.json(
        { success: false, error: 'X API not configured' },
        { status: 500 }
      )
    }

    // Use handle or xUserId from person record, or from request
    const searchHandle = handle || person.xHandle
    const searchUserId = xUserId || person.xUserId

    if (!searchHandle && !searchUserId) {
      return NextResponse.json(
        { success: false, error: 'Handle or xUserId required for hydration' },
        { status: 400 }
      )
    }

    let profileData: any = null
    let tweets: Tweet[] = []

    try {
      // Fetch profile data using X API v2 (users/by)
      if (searchUserId) {
        const profileUrl = `https://api.twitter.com/2/users/${searchUserId}?user.fields=description,profile_image_url,public_metrics`
        const profileResponse = await fetch(profileUrl, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (profileResponse.ok) {
          const profileJson = await profileResponse.json()
          profileData = profileJson.data
        }
      } else if (searchHandle) {
        // Fallback to v1.1 if we only have handle
        const profileUrl = `https://api.twitter.com/1.1/users/show.json?screen_name=${encodeURIComponent(searchHandle.replace('@', ''))}`
        const profileResponse = await fetch(profileUrl, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (profileResponse.ok) {
          profileData = await profileResponse.json()
        }
      }

      // Fetch recent tweets using X API v2
      if (searchUserId) {
        const tweetsUrl = `https://api.twitter.com/2/users/${searchUserId}/tweets?max_results=20&tweet.fields=created_at,public_metrics`
        const tweetsResponse = await fetch(tweetsUrl, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (tweetsResponse.ok) {
          const tweetsJson = await tweetsResponse.json()
          tweets = (tweetsJson.data || []).map((tweet: any) => ({
            id: tweet.id,
            text: tweet.text,
            createdAt: tweet.created_at,
            retweetCount: tweet.public_metrics?.retweet_count || 0,
            likeCount: tweet.public_metrics?.like_count || 0,
            replyCount: tweet.public_metrics?.reply_count || 0,
          }))
        }
      }
    } catch (apiError: any) {
      console.error('❌ X API error during hydration:', apiError)
      // Continue with partial data if API fails
    }

    // Update EcosystemPerson with fresh data
    const updateData: any = {
      lastHydratedAt: new Date(),
    }

    if (profileData) {
      // Extract data based on API version
      if (profileData.description) updateData.bio = profileData.description
      if (profileData.profile_image_url) updateData.profileImage = profileData.profile_image_url
      if (profileData.public_metrics?.followers_count) {
        updateData.followers = profileData.public_metrics.followers_count
      }
      // For v1.1 API
      if (profileData.followers_count) updateData.followers = profileData.followers_count
      if (profileData.profile_image_url_https) updateData.profileImage = profileData.profile_image_url_https
    }

    const updatedPerson = await prisma.ecosystemPerson.update({
      where: { id: personId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      person: updatedPerson,
      tweets,
      profileData,
    })
  } catch (error: any) {
    console.error('❌ POST /api/x/hydrate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to hydrate person' },
      { status: 500 }
    )
  }
}

