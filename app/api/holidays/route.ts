import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/holidays
 * List all holidays
 */
export async function GET(request: Request) {
  try {
    await verifyAuth(request)

    const holidays = await prisma.holiday.findMany({
      orderBy: { name: 'asc' },
      include: {
        assets: {
          select: {
            id: true,
            url: true,
            fileName: true,
            category: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: holidays,
    })
  } catch (error: any) {
    console.error('❌ GET /api/holidays error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list holidays',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

