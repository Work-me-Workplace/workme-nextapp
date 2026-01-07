/**
 * Add Workforce Stuff Item API Route
 * 
 * STEP 1: Infer type from raw text
 * Returns inference result + parsed fields for user review
 * Does NOT save to database yet - that happens in the save endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import type { ContextType } from '@/lib/types/context-type'

export async function POST(request: NextRequest) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rawText, type } = body

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    // If type is provided, user has confirmed - parse with that type
    if (type) {
      const validTypes: ContextType[] = [
        'training',
        'career',
        'event',
        'leader_engagement',
        'campaign',
        'impact_event',
        'community',
        'benefits',
        'employee_cause',
      ]

      if (!validTypes.includes(type as ContextType)) {
        return NextResponse.json(
          { success: false, error: `Invalid type: ${type}` },
          { status: 400 }
        )
      }

      // Parse content using the confirmed type
      const parsed = await parseCompanyXContent(rawText, type as ContextType)

      return NextResponse.json({
        success: true,
        parsedData: parsed.data,
        rawText,
      })
    }

    // No type provided - just infer (don't parse yet)
    const inference = await inferCompanyXType(rawText)
    const inferredType: ContextType = inference.type

    // Return inference only - user must confirm before parsing
    return NextResponse.json({
      success: true,
      inference: {
        type: inferredType,
        confidence: inference.confidence,
        explanation: inference.explanation,
      },
      rawText, // Send back for review page
    })
  } catch (error: any) {
    console.error('[Add Workforce Stuff - Infer] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to infer type' },
      { status: 500 }
    )
  }
}
