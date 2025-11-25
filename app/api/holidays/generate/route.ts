import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'
import { generateHolidayMessage } from '@/lib/holiday/generate'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/holidays/generate
 * Generate holiday content using AI
 */
export async function POST(request: Request) {
  try {
    await verifyAuth(request)

    const body = await request.json()
    const { holidaySlug } = body

    if (!holidaySlug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Holiday slug is required',
        },
        { status: 400 },
      )
    }

    // Get holiday
    const holiday = await prisma.holiday.findUnique({
      where: { slug: holidaySlug },
      include: {
        assets: true,
      },
    })

    if (!holiday) {
      return NextResponse.json(
        {
          success: false,
          error: 'Holiday not found',
        },
        { status: 404 },
      )
    }

    // Get all assets (holiday-specific and general)
    const allAssets = await prisma.asset.findMany({
      where: {
        OR: [
          { holidaySlug: holidaySlug },
          { category: 'holiday' },
          { category: 'general' },
        ],
      },
    })

    // Generate holiday message
    const message = await generateHolidayMessage(holidaySlug, allAssets)

    return NextResponse.json({
      success: true,
      data: message,
    })
  } catch (error: any) {
    console.error('❌ POST /api/holidays/generate error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate holiday content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

