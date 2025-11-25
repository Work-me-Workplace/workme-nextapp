import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/assets
 * Get assets by category or holiday
 * Query params: category, holiday
 */
export async function GET(request: Request) {
  try {
    await verifyAuth(request)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const holiday = searchParams.get('holiday')

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (holiday) {
      where.holidaySlug = holiday
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        holiday: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: assets,
    })
  } catch (error: any) {
    console.error('❌ GET /api/assets error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list assets',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

