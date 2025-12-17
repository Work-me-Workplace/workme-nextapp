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
    const { rawText } = body

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    // Step 1: Infer type
    const inference = await inferCompanyXType(rawText)
    const inferredType: ContextType = inference.type

    // Step 2: Parse content using appropriate mapper (but don't save yet)
    const parsed = await parseCompanyXContent(rawText, inferredType)

    // Return inference + parsed data for user review
    // NO DATABASE SAVE - user must review and confirm first
    return NextResponse.json({
      success: true,
      inference: {
        type: inferredType,
        confidence: inference.confidence,
        explanation: inference.explanation,
      },
      parsedData: parsed.data,
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
