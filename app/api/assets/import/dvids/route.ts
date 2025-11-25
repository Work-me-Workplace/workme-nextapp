import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'
import { importDVIDSAsset } from '@/lib/holiday/dvids'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/assets/import/dvids
 * Import asset from DVIDS URL
 * Admin-only tool
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)

    // TODO: Add admin check here if needed
    // For now, any authenticated user can import

    const body = await request.json()
    const { url, category, holidaySlug } = body

    if (!url || !category) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL and category are required',
        },
        { status: 400 },
      )
    }

    const validCategories = ['holiday', 'workforce', 'shipyard', 'general']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Category must be one of: ${validCategories.join(', ')}`,
        },
        { status: 400 },
      )
    }

    // Import from DVIDS
    const { filename, path, publicUrl, metadata } = await importDVIDSAsset(url, category)

    // Create database entry
    const asset = await prisma.asset.create({
      data: {
        url: publicUrl,
        fileName: filename,
        category,
        holidaySlug: holidaySlug || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...asset,
        metadata,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/assets/import/dvids error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to import DVIDS asset',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

