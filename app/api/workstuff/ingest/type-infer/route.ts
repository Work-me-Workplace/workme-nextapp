import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 1: Type Inference
 * 
 * Takes raw blob → Infers suggested type → Returns type only
 * No DB writes, no parsing, just type inference
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { blob } = await request.json()

    if (!blob || typeof blob !== 'string') {
      return NextResponse.json(
        { success: false, error: 'blob is required' },
        { status: 400 }
      )
    }

    // Infer type using hybrid inference service
    const inference = await inferCompanyXType(blob)

    // Return ContextType directly (matches CompanyX model types)
    // All ContextType values are valid CompanyX types
    return NextResponse.json({
      success: true,
      suggestedType: inference.type, // ContextType: campaign, impact_event, training, event, community, benefits, career, employee_cause
      confidence: inference.confidence,
      explanation: inference.explanation,
    })
  } catch (error: any) {
    console.error('[Type Infer] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to infer type' },
      { status: 500 }
    )
  }
}

