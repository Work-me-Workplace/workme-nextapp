import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { parseHighlight } from '@/lib/ai/highlightParser'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/ingest
 * 
 * Parse highlight text with AI and extract employee + highlight information
 * Creates a draft highlight in the database (can be updated later)
 * 
 * Body: {
 *   text: string (required) - raw citation text
 *   photoUrl?: string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth and get context
    const context = await getWorkMeContext(request)

    if (!context.companyId) {
      return NextResponse.json(
        { success: false, error: 'User must belong to a company' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { text, photoUrl } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'text is required' },
        { status: 400 }
      )
    }

    // 2. Parse with AI
    const parsed = await parseHighlight(text.trim())

    // 3. Create draft highlight in database (so we have an ID for the frontend)
    const highlight = await prisma.companyEmployeeHighlight.create({
      data: {
        citationText: parsed.citationText,
        achievement: parsed.achievement || null,
        narrative: parsed.narrative || null,
        classification: parsed.classification || null,
        awardName: parsed.awardName || null,
        awardingAgency: parsed.awardingAgency || null,
        awardYear: parsed.awardYear || null,
        supervisorQuote: parsed.supervisorQuote || null,
        photoUrl: photoUrl || null,
        companyUnitLabel: parsed.unit || null,
        createdByWorkMeId: context.workMeId,
      },
    })

    // 4. Return parsed data with highlight ID
    return NextResponse.json({
      success: true,
      employee: {
        fullName: parsed.fullName,
        title: parsed.title,
        email: null, // Not extracted from citation
        unitRaw: parsed.unit,
      },
      highlight: {
        id: highlight.id,
        citationText: highlight.citationText,
        achievement: highlight.achievement,
        narrative: highlight.narrative,
        classification: highlight.classification,
        awardName: highlight.awardName,
        awardingAgency: highlight.awardingAgency,
        awardYear: highlight.awardYear,
        supervisorQuote: highlight.supervisorQuote,
        photoUrl: highlight.photoUrl,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/highlights/ingest error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse highlight',
      },
      { status: 500 }
    )
  }
}
