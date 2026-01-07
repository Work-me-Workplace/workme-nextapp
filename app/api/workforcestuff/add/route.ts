/**
 * Add Workforce Stuff Item API Route
 * 
 * STEP 1: Infer type from raw text ONLY
 * This endpoint ONLY does inference - no parsing
 * Parsing happens in the save endpoint using the modular ingest pattern
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

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

    // Only infer type - no parsing here
    const inference = await inferCompanyXType(rawText)

    // Return inference only - user must confirm before parsing
    return NextResponse.json({
      success: true,
      inference: {
        type: inference.type,
        confidence: inference.confidence,
        explanation: inference.explanation,
      },
      rawText, // Send back for review page
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Add Workforce Stuff - Infer] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to infer type' },
      { status: 500 }
    )
  }
}
