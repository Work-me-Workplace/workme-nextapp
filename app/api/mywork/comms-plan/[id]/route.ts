import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mywork/comms-plan/[id]
 * 
 * Get a comms plan product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { id } = await params

    const product = await prisma.productCommsPlan.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Comms plan not found' },
        { status: 404 }
      )
    }

    if (product.createdByWorkMeId !== auth.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('❌ GET /api/mywork/comms-plan/[id] error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch comms plan',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/mywork/comms-plan/[id]
 * 
 * Update a comms plan product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await prisma.productCommsPlan.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Comms plan not found' },
        { status: 404 }
      )
    }

    if (existing.createdByWorkMeId !== auth.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update fields
    // For Json fields, use undefined instead of null, and handle empty arrays
    const updated = await prisma.productCommsPlan.update({
      where: { id },
      data: {
        rawText: body.rawText !== undefined ? body.rawText : undefined,
        parsedTitle: body.title !== undefined ? body.title : undefined,
        parsedObjectives: body.objectives !== undefined 
          ? (body.objectives.length > 0 ? body.objectives : undefined)
          : undefined,
        parsedMessages: body.messages !== undefined
          ? (body.messages.length > 0 ? body.messages : undefined)
          : undefined,
        parsedTactics: body.tactics !== undefined
          ? (body.tactics.length > 0 ? body.tactics : undefined)
          : undefined,
        parsedTimeline: body.timeline !== undefined ? body.timeline : undefined,
        fullText: body.fullText !== undefined ? body.fullText : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      product: updated,
    })
  } catch (error: any) {
    console.error('❌ PUT /api/mywork/comms-plan/[id] error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update comms plan',
      },
      { status: 500 }
    )
  }
}
