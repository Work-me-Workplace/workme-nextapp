/**
 * WorkStuff Type Inference API
 * 
 * POST /api/workstuff/infer-type
 * 
 * Takes raw blob → Infers suggested type → Returns type only
 * No DB writes, no parsing, just type inference
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireWorkMeAuth(request)

    const { blob } = await request.json()

    if (!blob || typeof blob !== 'string') {
      return NextResponse.json(
        { success: false, error: 'blob is required' },
        { status: 400 }
      )
    }

    const inference = await inferCompanyXType(blob)

    return NextResponse.json({
      success: true,
      suggestedType: inference.type,
      confidence: inference.confidence,
      explanation: inference.explanation,
    })
  } catch (error: any) {
    console.error('[WorkStuff Type Infer] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to infer type' },
      { status: 500 }
    )
  }
}
