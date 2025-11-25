import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/holidays/create
 * Create a new holiday
 */
export async function POST(request: Request) {
  try {
    await verifyAuth(request)

    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and slug are required',
        },
        { status: 400 },
      )
    }

    // Check if slug already exists
    const existing = await prisma.holiday.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Holiday with this slug already exists',
        },
        { status: 400 },
      )
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        slug,
      },
    })

    return NextResponse.json({
      success: true,
      data: holiday,
    })
  } catch (error: any) {
    console.error('❌ POST /api/holidays/create error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create holiday',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

