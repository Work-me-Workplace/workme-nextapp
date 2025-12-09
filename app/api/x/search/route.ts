/**
 * GET /api/x/search
 * 
 * Search X users by name
 * Uses X API v1.1 users/search endpoint
 * 
 * Query params: q (search query/name)
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'

export const dynamic = 'force-dynamic'

interface XUserSearchResult {
  fullName: string
  handle: string
  xUserId: string
  profileImage: string
  bio: string
  followers: number
}

export async function GET(request: NextRequest) {
  try {
    // Verify auth (optional - could make public)
    await verifyAuth(request as Request)

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query (q) parameter is required' },
        { status: 400 }
      )
    }

    // Get X API credentials from environment
    const bearerToken = process.env.X_BEARER_TOKEN
    if (!bearerToken) {
      console.error('❌ X_BEARER_TOKEN not configured')
      return NextResponse.json(
        { success: false, error: 'X API not configured' },
        { status: 500 }
      )
    }

    // Call X API v1.1 users/search
    const xUrl = `https://api.twitter.com/1.1/users/search.json?q=${encodeURIComponent(query)}&count=5`
    
    const xResponse = await fetch(xUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!xResponse.ok) {
      const errorText = await xResponse.text()
      console.error('❌ X API error:', xResponse.status, errorText)
      return NextResponse.json(
        { success: false, error: `X API error: ${xResponse.status}` },
        { status: xResponse.status }
      )
    }

    const xData = await xResponse.json()

    // Transform X API response to our format
    const results: XUserSearchResult[] = xData.map((user: any) => ({
      fullName: user.name || '',
      handle: user.screen_name || '',
      xUserId: user.id_str || user.id?.toString() || '',
      profileImage: user.profile_image_url_https || user.profile_image_url || '',
      bio: user.description || '',
      followers: user.followers_count || 0,
    }))

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error('❌ GET /api/x/search error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search X users' },
      { status: 500 }
    )
  }
}

