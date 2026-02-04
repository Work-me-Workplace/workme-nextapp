/**
 * POST /api/assets/import/dvids/preview
 * 
 * Preview DVIDS page without importing
 * Returns extracted image URL and metadata for preview
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { parseDVIDSPage } from '@/lib/assets/dvids'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireWorkMeAuth(request)

    const body = await request.json()
    const { dvidsUrl } = body

    if (!dvidsUrl || typeof dvidsUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'DVIDS URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let urlObj: URL
    try {
      urlObj = new URL(dvidsUrl)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate it's a DVIDS URL
    if (!urlObj.hostname.includes('dvidshub') && !urlObj.hostname.includes('dodmedia')) {
      return NextResponse.json(
        { success: false, error: 'URL must be from DVIDS (dvidshub.net or dodmedia.osd.mil)' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/assets/import/dvids/preview] Previewing:', dvidsUrl)

    // Parse DVIDS page to extract image URL and metadata
    const dvidsData = await parseDVIDSPage(dvidsUrl)

    if (!dvidsData || !dvidsData.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Could not extract image from DVIDS page' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dvidsData,
    })
  } catch (error: any) {
    console.error('❌ POST /api/assets/import/dvids/preview error:', error)

    // Handle auth errors
    if (error.message?.includes('Unauthorized') || error.message?.includes('authentication')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Handle specific DVIDS parsing errors
    if (error.message?.includes('Could not find image')) {
      return NextResponse.json(
        { success: false, error: 'Could not find image on DVIDS page. Please check the URL.' },
        { status: 400 }
      )
    }

    if (error.message?.includes('Failed to fetch')) {
      return NextResponse.json(
        { success: false, error: 'Failed to access DVIDS page. The page may be private or the URL may be invalid.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to preview DVIDS page' },
      { status: 500 }
    )
  }
}
