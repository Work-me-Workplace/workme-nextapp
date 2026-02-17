import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { analyzeWorkItemIntentBulk } from '@/lib/services/workops-ai-service'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const analyzeBulkSchema = z.object({
  rawText: z.string().min(1, 'Text is required'),
  category: z.enum(['my_thoughts', 'boss', 'company_stuff']),
})

/**
 * POST /api/workops/item/analyze-bulk
 * Detect multiple items in pasted text (bullets/numbered lines), analyze each, return array.
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    if (!firebaseId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = analyzeBulkSchema.parse(body)

    const analyses = await analyzeWorkItemIntentBulk({
      rawText: validated.rawText,
      category: validated.category,
    })

    console.log('[API POST /api/workops/item/analyze-bulk] SUCCESS', {
      category: validated.category,
      count: analyses.length,
    })

    return NextResponse.json({
      success: true,
      analyses,
    })
  } catch (error: any) {
    console.error('❌ POST /api/workops/item/analyze-bulk error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze work items',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
