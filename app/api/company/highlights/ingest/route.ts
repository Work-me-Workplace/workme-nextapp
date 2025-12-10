import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { parseHighlight } from '@/lib/ai/highlightParser'

export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/ingest
 * 
 * Parse highlight text with AI and extract employee + highlight information
 * Does NOT save to database - just parsing
 * 
 * Body: {
 *   text: string (required) - raw citation text
 *   photoUrl?: string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    const context = await getWorkMeContext(firebaseId)

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

    // 3. Return parsed data (no DB writes yet)
    return NextResponse.json({
      success: true,
      employee: {
        fullName: parsed.fullName,
        title: parsed.title,
        email: null, // Not extracted from citation
        unitRaw: parsed.unit,
      },
      highlight: {
        citationText: parsed.citationText,
        achievement: parsed.achievement,
        narrative: parsed.narrative,
        classification: parsed.classification,
        awardName: parsed.awardName,
        awardingAgency: parsed.awardingAgency,
        awardYear: parsed.awardYear,
        supervisorQuote: parsed.supervisorQuote,
        photoUrl: photoUrl || null,
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
