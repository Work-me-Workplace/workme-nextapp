import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseCommsPlan } from '@/lib/services/comms-plan-parser'

export const dynamic = 'force-dynamic'

interface CreateCommsPlanRequest {
  rawText?: string
  title?: string
  objectives?: string[]
  messages?: string[]
  tactics?: string[]
  timeline?: any
  companyUnit?: string
}

/**
 * POST /api/mywork/comms-plan/create
 * 
 * Create a ProductCommsPlan product
 * If rawText is provided, parse it into structured fields
 * Otherwise, use the provided structured fields directly
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkMeAuth(request)
    const body: CreateCommsPlanRequest = await request.json()
    const { rawText, title, objectives, messages, tactics, timeline, companyUnit } = body

    // If rawText is provided, parse it
    let parsedFields = {
      title: title || null,
      objectives: objectives || [],
      messages: messages || [],
      tactics: tactics || [],
      timeline: timeline || null,
    }

    if (rawText && rawText.trim()) {
      try {
        const parseResult = await parseCommsPlan(rawText.trim())
        // Merge parsed fields with provided fields (provided fields take precedence)
        parsedFields = {
          title: title || parseResult.parsed.title,
          objectives: objectives || parseResult.parsed.objectives,
          messages: messages || parseResult.parsed.messages,
          tactics: tactics || parseResult.parsed.tactics,
          timeline: timeline || parseResult.parsed.timeline,
        }
      } catch (parseError) {
        console.error('[POST /api/mywork/comms-plan/create] Parse error:', parseError)
        // Continue with provided fields if parsing fails
      }
    }

    // Create the product
    const product = await prisma.productCommsPlan.create({
      data: {
        companyUnit: companyUnit || null,
        createdByWorkMeId: auth.id,
        rawText: rawText || null,
        parsedTitle: parsedFields.title,
        parsedObjectives: parsedFields.objectives.length > 0 ? parsedFields.objectives : null,
        parsedMessages: parsedFields.messages.length > 0 ? parsedFields.messages : null,
        parsedTactics: parsedFields.tactics.length > 0 ? parsedFields.tactics : null,
        parsedTimeline: parsedFields.timeline,
      },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('❌ POST /api/mywork/comms-plan/create error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create comms plan product',
      },
      { status: 500 }
    )
  }
}
