/**
 * POST /api/x/lookup
 * 
 * Lookup Twitter/X handle for a given name or handle
 * Body: { query: string, type: 'organization' | 'person' | 'hashtag' }
 * 
 * This is a stub that will eventually call Twitter/X API v2 to verify handles
 * For now, it does basic normalization and validation
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    await loadWorkMe(firebaseId) // Just verify auth

    const body = await request.json()
    const { query, type } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    // Normalize the query
    let normalizedHandle = query.trim()

    if (type === 'hashtag') {
      // For hashtags, ensure it starts with #
      normalizedHandle = normalizedHandle.startsWith('#') ? normalizedHandle : `#${normalizedHandle}`
      // Remove any @ symbols
      normalizedHandle = normalizedHandle.replace('@', '')
    } else {
      // For organizations and people, ensure it starts with @
      normalizedHandle = normalizedHandle.startsWith('@') ? normalizedHandle : `@${normalizedHandle}`
      // Remove any # symbols
      normalizedHandle = normalizedHandle.replace('#', '')
      // Remove spaces and convert to lowercase for handles
      if (type === 'person') {
        // For person names, try to create a handle from the name
        normalizedHandle = `@${normalizedHandle.replace(/^@/, '').replace(/\s+/g, '').toLowerCase()}`
      } else {
        // For organizations, keep the original but ensure @ prefix
        normalizedHandle = normalizedHandle.replace(/^@/, '')
        normalizedHandle = `@${normalizedHandle.toUpperCase()}`
      }
    }

    // TODO: Call Twitter/X API v2 to verify handle exists
    // For now, return normalized handle with verified: false
    // Example API call:
    // const response = await fetch(`https://api.twitter.com/2/users/by/username/${normalizedHandle.replace('@', '')}`, {
    //   headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` }
    // })

    return NextResponse.json({
      success: true,
      handle: normalizedHandle,
      displayName: query.trim(),
      verified: false, // Will be true once Twitter API integration is added
      note: 'Handle normalization complete. Twitter API verification coming soon.',
    })
  } catch (error: any) {
    console.error('❌ POST /api/x/lookup error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to lookup handle' },
      { status: 500 }
    )
  }
}
