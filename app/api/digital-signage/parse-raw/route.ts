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
      personName,
      unit,
      achievement,
      details, // This is the raw citation text/JSON
    } = body

    if (!personName || !details) {
      return NextResponse.json(
        { success: false, error: 'personName and details (raw text) are required' },
        { status: 400 }
      )
    }

    // Send raw data to GPT builder service
    // The service will parse the raw text and extract structured data
    const built = await buildDigitalSignFromHighlight({
      employeeFullName: personName,
      employeeTitle: null,
      employeeUnit: unit || null,
      companyUnitLabel: unit || null,
      awardName: null, // GPT will extract from raw text
      awardingAgency: null, // GPT will extract from raw text
      awardYear: null, // GPT will extract from raw text
      achievement: achievement || null,
      citationText: details, // This is the raw text we send to GPT
      classification: null,
    })

    return NextResponse.json({
      success: true,
      data: {
        headline: built.headline,
        subhead: built.subhead,
        detailBlock: built.detailBlock,
        runtimeGuidance: built.runtimeGuidance,
        suggestedImageDescription: built.suggestedImageDescription,
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
