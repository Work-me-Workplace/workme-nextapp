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

    // Load user's ecosystem contacts (people they're tracking)
    const contacts = await prisma.myEcosystemContact.findMany({
      where: { 
        workMeId: workMe.id,
        person: {
          xHandle: { not: null }, // Only people with X handles
        },
      },
      include: {
        person: true,
      },
    })

    // Extract handles from contacts
    const handles = contacts
      .map((c) => c.person)
      .filter((p) => p && p.xHandle)
      .map((p) => p!.xHandle!.replace('@', ''))

    if (handles.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No ecosystem contacts with X handles found. Visit /ecosystem/search to add people.',
      })
    }

    console.log('[API POST /api/x/feed]', {
      workMeId: workMe.id,
      handlesCount: handles.length,
      handles,
    })

    // TODO: Call X API v2 to fetch tweets from these handles
    // Example:
    // const tweets = await fetchTweetsFromHandles(handles)
    // const results = await classifyAndNormalizeTweets(tweets)

    // For now, return structured response indicating what would be fetched
    return NextResponse.json({
      success: true,
      results: [],
      message: 'X Feed endpoint ready. X API integration pending.',
      preferences: {
        handles,
        totalContacts: handles.length,
      },
      note: 'Once X API is integrated, this will return actual tweets from the people in your ecosystem.',
    })
  } catch (error: any) {
    console.error('❌ POST /api/x/feed error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process X feed' },
      { status: 500 }
    )
  }
}
