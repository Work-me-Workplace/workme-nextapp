/**
 * POST /api/assets/import/dvids
 * 
 * Import asset from DVIDS (Defense Visual Information Distribution Service)
 * 
 * Flow:
 * 1. Parse DVIDS URL to extract image URL and metadata
 * 2. Download the image
 * 3. Upload to blob storage
 * 4. Save asset record in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { parseDVIDSPage, downloadImage } from '@/lib/assets/dvids'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireWorkMeAuth(request)

    const body = await request.json()
    const { dvidsUrl, title, description, tags } = body

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

    console.log('[API POST /api/assets/import/dvids] Processing:', dvidsUrl)

    // Step 1: Parse DVIDS page to extract image URL and metadata
    const dvidsData = await parseDVIDSPage(dvidsUrl)

    if (!dvidsData || !dvidsData.imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Could not extract image from DVIDS page' },
        { status: 400 }
      )
    }

    // Step 2: Download the image
    const { buffer, contentType, filename } = await downloadImage(dvidsData.imageUrl)

    // Step 3: Upload to blob storage
    const blobKey = `assets/dvids/${crypto.randomUUID()}-${filename}`
    const blob = new Blob([buffer], { type: contentType })
    const { url } = await put(blobKey, blob, { access: 'public' })

    // Step 4: Save asset in database
    const asset = await prisma.asset.create({
      data: {
        url,
        filename: filename,
        size: buffer.length,
        contentType: contentType,
        type: contentType.startsWith('image') ? 'image' : 'file',
        title: title || dvidsData.title || filename.replace(/\.[^/.]+$/, ''),
        description: description || dvidsData.description || undefined,
        tags: tags || dvidsData.tags || [],
      },
    })

    console.log('[API POST /api/assets/import/dvids] SUCCESS:', {
      assetId: asset.id,
      url: asset.url,
    })

    return NextResponse.json({
      success: true,
      data: asset,
    })
  } catch (error: any) {
    console.error('❌ POST /api/assets/import/dvids error:', error)

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
      { success: false, error: error.message || 'Failed to import asset from DVIDS' },
      { status: 500 }
    )
  }
}
