import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseCommsPlan } from '@/lib/services/comms-plan-parser'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mywork/comms-plan/[id]/parse
 * 
 * Parse raw text for an existing comms plan and update structured fields
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { id } = await params
    const body = await request.json()
    const { rawText } = body

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    // Verify ownership
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

    // Parse the raw text
    const parseResult = await parseCommsPlan(rawText.trim())

    // Update the product with parsed fields
    const updated = await prisma.productCommsPlan.update({
      where: { id },
      data: {
        rawText: rawText.trim(),
        parsedTitle: parseResult.parsed.title,
        parsedObjectives: parseResult.parsed.objectives.length > 0 ? parseResult.parsed.objectives : undefined,
        parsedMessages: parseResult.parsed.messages.length > 0 ? parseResult.parsed.messages : undefined,
        parsedTactics: parseResult.parsed.tactics.length > 0 ? parseResult.parsed.tactics : undefined,
        parsedTimeline: parseResult.parsed.timeline || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      product: updated,
      parsed: parseResult.parsed,
    })
  } catch (error: any) {
    console.error('❌ POST /api/mywork/comms-plan/[id]/parse error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse comms plan',
      },
      { status: 500 }
    )
  }
}
