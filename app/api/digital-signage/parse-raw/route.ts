import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { buildDigitalSignFromHighlight } from '@/lib/services/digital-sign-employee-highlight-builder-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/digital-signage/parse-raw
 * 
 * Takes raw text/data and sends to GPT to get structured digital signage output
 * This is STEP 1 - parse raw data with GPT
 */
export async function POST(request: NextRequest) {
  try {
    await requireWorkMeAuth(request)
    const body = await request.json()
    
    const { 
      details, // This is the raw citation text/JSON - GPT extracts EVERYTHING from this
    } = body

    if (!details || !details.trim()) {
      return NextResponse.json(
        { success: false, error: 'details (raw text) is required' },
        { status: 400 }
      )
    }

    // Send ONLY raw text to GPT builder service
    // GPT will extract person name, award, year, agency, etc. from the raw text
    const built = await buildDigitalSignFromHighlight({
      employeeFullName: '', // GPT will extract from raw text
      employeeTitle: null,
      employeeUnit: null, // GPT will extract from raw text
      companyUnitLabel: null, // GPT will extract from raw text
      awardName: null, // GPT will extract from raw text
      awardingAgency: null, // GPT will extract from raw text
      awardYear: null, // GPT will extract from raw text
      achievement: null, // GPT will extract from raw text
      citationText: details, // This is the raw text - GPT extracts EVERYTHING from this
      classification: null, // GPT will extract from raw text
    })

    // Map new structure to response format
    // Combine factualStatement, quote, and quoteAttribution into detailBlock for compatibility
    const detailBlock = [
      built.factualStatement,
      built.quote ? `"${built.quote}"` : '',
      built.quoteAttribution ? `— ${built.quoteAttribution}` : ''
    ].filter(Boolean).join(' ').trim() || null

    return NextResponse.json({
      success: true,
      data: {
        headline: built.headline,
        subhead: built.subhead,
        factualStatement: built.factualStatement,
        quote: built.quote,
        quoteAttribution: built.quoteAttribution,
        detailBlock: detailBlock, // For backward compatibility
        runtimeGuidance: built.runtimeGuidance,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/digital-signage/parse-raw error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse raw data with GPT',
      },
      { status: 500 }
    )
  }
}
