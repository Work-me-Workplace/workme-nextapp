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
      // Use v2 endpoints that work with Basic tier
      // Basic tier supports: /2/users/by/username/:username (not /2/users/:id)
      const cleanHandle = searchHandle?.replace('@', '') || null
      
      if (cleanHandle) {
        // Fetch profile using username lookup (Basic tier compatible)
        const profileUrl = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(cleanHandle)}?user.fields=description,profile_image_url,public_metrics,created_at`
        const profileResponse = await fetch(profileUrl, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text()
          console.error(`❌ X API profile error (${profileResponse.status}):`, errorText)
          
          // If 403, it's an access level issue
          if (profileResponse.status === 403) {
            throw new Error(`X API access level insufficient. Error: ${errorText}`)
          }
        } else {
          const profileJson = await profileResponse.json()
          profileData = profileJson.data
          
          // Store xUserId if we got it
          if (profileData?.id && !person.xUserId) {
            await prisma.ecosystemPerson.update({
              where: { id: personId },
              data: { xUserId: profileData.id },
            })
          }
        }
      } else if (searchUserId) {
        // If we have userId, try direct lookup (may not work on Basic tier)
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
        } else {
          const errorText = await profileResponse.text()
          console.error(`❌ X API profile error (${profileResponse.status}):`, errorText)
          if (profileResponse.status === 403) {
            throw new Error(`X API access level insufficient. Try using username instead of user ID. Error: ${errorText}`)
          }
        }
      }

      // Fetch recent tweets - Basic tier supports user timeline endpoint
      const userIdForTweets = profileData?.id || searchUserId
      if (userIdForTweets) {
        // Use /2/users/:id/tweets endpoint (should work on Basic tier)
        const tweetsUrl = `https://api.twitter.com/2/users/${userIdForTweets}/tweets?max_results=10&tweet.fields=created_at,public_metrics,text`
        const tweetsResponse = await fetch(tweetsUrl, {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!tweetsResponse.ok) {
          const errorText = await tweetsResponse.text()
          console.error(`❌ X API tweets error (${tweetsResponse.status}):`, errorText)
          
          // If 403, log but don't fail - tweets are optional
          if (tweetsResponse.status === 403) {
            console.warn('⚠️ X API tweets endpoint not available on current access tier. Profile data will still be updated.')
          }
        } else {
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
      
      // If it's an access level error, provide helpful message
      if (apiError.message?.includes('access level')) {
        throw apiError // Re-throw to surface to user
      }
      
      // For other errors, continue with partial data
      console.warn('⚠️ Continuing with partial data due to API error')
    }

    // Update EcosystemPerson with fresh data
    const updateData: any = {
      lastHydratedAt: new Date(),
    }

    if (profileData) {
      // Extract data from v2 API response
      if (profileData.description) updateData.bio = profileData.description
      if (profileData.profile_image_url) updateData.profileImage = profileData.profile_image_url
      if (profileData.public_metrics?.followers_count !== undefined) {
        updateData.followers = profileData.public_metrics.followers_count
      }
      // Store xUserId if we got it from the API
      if (profileData.id && !person.xUserId) {
        updateData.xUserId = profileData.id
      }
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

