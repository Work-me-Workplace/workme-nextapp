/**
 * POST /api/x/feed
 * 
 * X Feed Signal - Live X feed signals from user's ecosystem contacts
 * 
 * Uses user's saved ecosystem contacts to fetch relevant tweets
 * 
 * Purpose: Pull feed → AI classify → Normalize
 * High frequency, public-facing signals from X
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    // Load user's ecosystem contacts with X feed follows enabled
    const contacts = await prisma.myEcosystemContact.findMany({
      where: { 
        workMeId: workMe.id,
        followForXFeed: true,
        person: {
          xHandle: { not: null }, // Only contacts with X handles
        },
      },
      include: {
        person: true,
      },
    })

    if (contacts.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No X feed follows found. Visit /signal/x/tune to add contacts to follow.',
      })
    }

    // Get X API credentials
    const bearerToken = process.env.X_BEARER_TOKEN
    if (!bearerToken) {
      return NextResponse.json({
        success: false,
        error: 'X API not configured',
      }, { status: 500 })
    }

    // Free tier limits
    const FREE_TIER_MONTHLY_LIMIT = 100 // Total posts per month
    const MAX_TWEETS_PER_REQUEST = 20 // Hard cap per API call (safety limit)
    const MAX_TWEETS_PER_CONTACT = 5 // Max tweets per contact per request
    
    // Filter contacts that have xUserId resolved (more efficient - uses stored ID)
    const contactsWithUserId = contacts.filter(c => c.person.xUserId !== null)
    
    if (contactsWithUserId.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No contacts with resolved X user IDs. Use /api/x/resolve-user-id to resolve handles first.',
        usage: {
          fetched: 0,
          limit: FREE_TIER_MONTHLY_LIMIT,
          remaining: FREE_TIER_MONTHLY_LIMIT,
          maxPerRequest: MAX_TWEETS_PER_REQUEST,
        },
        preferences: {
          totalContacts: contacts.length,
          contactsNeedingResolution: contacts.filter(c => c.followForXFeed && !c.person.xUserId).map(c => ({
            personId: c.personId,
            handle: c.person.xHandle,
            personName: c.person.fullName,
          })),
        },
      })
    }

    // Calculate how many tweets per contact we can fetch
    // Respect both: monthly limit AND per-request limit
    const tweetsPerContact = Math.max(1, Math.floor(FREE_TIER_MONTHLY_LIMIT / contactsWithUserId.length))
    const maxResultsPerContact = Math.min(tweetsPerContact, MAX_TWEETS_PER_CONTACT)
    
    // Also cap total tweets per request
    const maxTotalTweets = Math.min(
      contactsWithUserId.length * maxResultsPerContact,
      MAX_TWEETS_PER_REQUEST
    )

    console.log('[API POST /api/x/feed]', {
      workMeId: workMe.id,
      contactsCount: contacts.length,
      contactsWithUserId: contactsWithUserId.length,
      tweetsPerContact: maxResultsPerContact,
      maxTotalTweets,
      monthlyLimit: FREE_TIER_MONTHLY_LIMIT,
      requestLimit: MAX_TWEETS_PER_REQUEST,
    })

    // Fetch tweets using stored xUserId (more efficient - one less API call per handle)
    const allTweets: any[] = []
    let totalFetched = 0

    for (const contact of contactsWithUserId) {
      try {
        const userId = contact.person.xUserId!
        const handle = contact.person.xHandle || 'unknown'
        const personName = contact.person.fullName
        const profileImage = contact.person.profileImage

        // Get tweets directly using xUserId (no handle lookup needed!)
        // Use maxResultsPerContact to respect per-contact limit
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResultsPerContact}&tweet.fields=created_at,public_metrics,text&exclude=retweets,replies`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!tweetsResponse.ok) {
          const errorText = await tweetsResponse.text()
          console.error(`❌ X API tweets error for ${handle} (${tweetsResponse.status}):`, errorText)
          
          // If 403, it's an access level issue
          if (tweetsResponse.status === 403) {
            console.warn(`⚠️ Tweets endpoint not available for ${handle} on current tier`)
          }
          continue // Skip this contact, continue with others
        }

        const tweetsData = await tweetsResponse.json()
        const tweets = (tweetsData.data || []).map((tweet: any) => ({
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          handle: handle ? `@${handle}` : null,
          personName,
          profileImage,
          personId: contact.personId,
          stance: contact.stance,
          relationshipType: contact.relationshipType,
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0,
          replyCount: tweet.public_metrics?.reply_count || 0,
        }))

        allTweets.push(...tweets)
        totalFetched += tweets.length

        // Stop if we hit the per-request limit (safety cap)
        if (totalFetched >= MAX_TWEETS_PER_REQUEST) {
          console.warn(`⚠️ Hit per-request limit (${MAX_TWEETS_PER_REQUEST}). Stopping fetch.`)
          break
        }

        // Also stop if we're approaching monthly limit (with buffer)
        if (totalFetched >= FREE_TIER_MONTHLY_LIMIT - 10) {
          console.warn(`⚠️ Approaching monthly limit. Stopping fetch.`)
          break
        }
      } catch (error: any) {
        console.error(`❌ Error fetching tweets for ${contact.person.fullName}:`, error.message)
        // Continue with other contacts
      }
    }

    // Sort by date (newest first)
    allTweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      results: allTweets,
      usage: {
        fetched: totalFetched,
        limit: FREE_TIER_MONTHLY_LIMIT,
        remaining: FREE_TIER_MONTHLY_LIMIT - totalFetched,
        maxPerRequest: MAX_TWEETS_PER_REQUEST,
        contactsProcessed: contactsWithUserId.length,
        tweetsPerContact: maxResultsPerContact,
        needsResolution: contacts.filter(c => c.followForXFeed && !c.person.xUserId).length,
        limitReached: totalFetched >= MAX_TWEETS_PER_REQUEST,
      },
      preferences: {
        totalContacts: contacts.length,
        contactsWithUserId: contactsWithUserId.length,
        contactsNeedingResolution: contacts.filter(c => c.followForXFeed && !c.person.xUserId).map(c => ({
          personId: c.personId,
          handle: c.person.xHandle,
          personName: c.person.fullName,
        })),
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/x/feed error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process X feed' },
      { status: 500 }
    )
  }
}
