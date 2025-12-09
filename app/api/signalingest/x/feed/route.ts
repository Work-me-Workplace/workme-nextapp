/**
 * POST /api/signalingest/x/feed
 * 
 * X Feed Signal - Live Twitter/X feed signals
 * 
 * Uses user's saved X Feed preferences to fetch relevant tweets
 * 
 * Purpose: Pull feed → AI classify → Normalize
 * High frequency, public-facing signals from X/Twitter
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

    // Load user's X Feed preferences
    const follows = await prisma.xFeedFollow.findMany({
      where: { workMeId: workMe.id },
      orderBy: [{ type: 'asc' }, { displayName: 'asc' }],
    })

    if (follows.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No X Feed preferences found. Visit /signal/x/tune to configure your feed.',
      })
    }

    // Extract handles for API calls
    const handles = follows
      .filter((f) => f.handle && (f.type === 'organization' || f.type === 'person'))
      .map((f) => f.handle!.replace('@', ''))
    const hashtags = follows
      .filter((f) => f.type === 'hashtag' && f.handle)
      .map((f) => f.handle!.replace('#', ''))

    console.log('[API POST /api/signalingest/x/feed]', {
      workMeId: workMe.id,
      handlesCount: handles.length,
      hashtagsCount: hashtags.length,
      handles,
      hashtags,
    })

    // TODO: Call Twitter/X API v2 to fetch tweets
    // Example:
    // const tweets = await fetchTweetsFromHandles(handles)
    // const hashtagTweets = await fetchTweetsByHashtags(hashtags)
    // const results = await classifyAndNormalizeTweets([...tweets, ...hashtagTweets])

    // For now, return structured response indicating what would be fetched
    return NextResponse.json({
      success: true,
      results: [],
      message: 'X Feed endpoint ready. Twitter API integration pending.',
      preferences: {
        handles,
        hashtags,
        totalFollows: follows.length,
      },
      note: 'Once Twitter API is integrated, this will return actual tweets from the handles and hashtags you follow.',
    })
  } catch (error: any) {
    console.error('❌ POST /api/signalingest/x/feed error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process X feed' },
      { status: 500 }
    )
  }
}

