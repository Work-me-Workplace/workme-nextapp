import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { generateFullCommsPlan } from '@/lib/services/comms-plan-generator'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mywork/comms-plan/[id]/generate
 * 
 * Generate full comms plan text/JSON from structured fields and save it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { id } = await params

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

    // Build structured fields from product
    const structuredFields = {
      title: product.parsedTitle,
      objectives: Array.isArray(product.parsedObjectives) ? product.parsedObjectives : [],
      messages: Array.isArray(product.parsedMessages) ? product.parsedMessages : [],
      tactics: Array.isArray(product.parsedTactics) ? product.parsedTactics : [],
      timeline: product.parsedTimeline,
    }

    // Generate full comms plan
    const generationResult = await generateFullCommsPlan(structuredFields)

    // Update product with generated full text
    const updated = await prisma.productCommsPlan.update({
      where: { id },
      data: {
        fullText: generationResult.fullText,
      },
    })

    return NextResponse.json({
      success: true,
      product: updated,
      fullText: generationResult.fullText,
    })
  } catch (error: any) {
    console.error('❌ POST /api/mywork/comms-plan/[id]/generate error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate full comms plan',
      },
      { status: 500 }
    )
  }
}
