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
  type?: 'WORKFORCE_CONCERN' | 'EVENT' | 'GENERAL'
  externalCompanyPressureId?: string // For WORKFORCE_CONCERN type
  background?: string // Manual background, or will be auto-generated from pressures
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
    const { 
      rawText, 
      title, 
      objectives, 
      messages, 
      tactics, 
      timeline, 
      companyUnit,
      type = 'GENERAL',
      externalCompanyPressureId,
      background: manualBackground
    } = body

    // Fetch background context if linked to external pressure
    let backgroundContext = manualBackground || null
    if (type === 'WORKFORCE_CONCERN' && externalCompanyPressureId) {
      // Get the specific pressure
      const pressure = await prisma.externalCompanyPressure.findUnique({
        where: { id: externalCompanyPressureId },
      })

      if (pressure) {
        // Get full history of related pressures (same workforce concern type)
        const relatedPressures = await prisma.externalCompanyPressure.findMany({
          where: {
            workMeId: auth.id,
            workforceConcern: pressure.workforceConcern,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 related pressures
        })

        // Build background from pressure history
        const pressureHistory = relatedPressures.map(p => 
          `- ${p.title} (${p.source}): ${p.summary}${p.impact ? ` Impact: ${p.impact}` : ''} [Severity: ${p.levelOfSeverity}/5]`
        ).join('\n')

        backgroundContext = `Workforce Concern: ${pressure.workforceConcern}\n\n` +
          `Current Pressure:\n${pressure.title} (${pressure.source}): ${pressure.summary}${pressure.impact ? `\nImpact: ${pressure.impact}` : ''}\n` +
          `Severity Level: ${pressure.levelOfSeverity}/5\n\n` +
          `Historical Context (Related Pressures):\n${pressureHistory}`
      }
    }

    // If rawText is provided, parse it
    let parsedFields = {
      title: title || null,
      background: backgroundContext,
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
          background: backgroundContext || parseResult.parsed.background,
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
        type: type as any,
        externalCompanyPressureId: externalCompanyPressureId || undefined,
        background: parsedFields.background,
        rawText: rawText || null,
        parsedTitle: parsedFields.title,
        parsedObjectives: parsedFields.objectives.length > 0 ? parsedFields.objectives : undefined,
        parsedMessages: parsedFields.messages.length > 0 ? parsedFields.messages : undefined,
        parsedTactics: parsedFields.tactics.length > 0 ? parsedFields.tactics : undefined,
        parsedTimeline: parsedFields.timeline || undefined,
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
