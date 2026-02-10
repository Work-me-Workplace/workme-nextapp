import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { generateFullCommsPlan, type CommsPlanStructuredFields } from '@/lib/services/comms-plan-generator'

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
    // Convert Prisma JsonArray to string[] by filtering and casting
    const objectives: string[] = Array.isArray(product.parsedObjectives)
      ? product.parsedObjectives.filter((obj): obj is string => typeof obj === 'string')
      : []
    
    const messages: string[] = Array.isArray(product.parsedMessages)
      ? product.parsedMessages.filter((msg): msg is string => typeof msg === 'string')
      : []
    
    const tactics: string[] = Array.isArray(product.parsedTactics)
      ? product.parsedTactics.filter((tactic): tactic is string => typeof tactic === 'string')
      : []
    
    const timeline: CommsPlanStructuredFields['timeline'] = 
      product.parsedTimeline && 
      typeof product.parsedTimeline === 'object' && 
      product.parsedTimeline !== null && 
      'phases' in product.parsedTimeline
        ? (product.parsedTimeline as {
            phases: Array<{
              name: string
              startDate?: string
              endDate?: string
              products: Array<{
                name: string
                channel: string
                audience: string
                timing?: string
              }>
            }>
          })
        : null

    const structuredFields: CommsPlanStructuredFields = {
      title: product.parsedTitle,
      background: product.background,
      objectives,
      messages,
      tactics,
      timeline,
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
