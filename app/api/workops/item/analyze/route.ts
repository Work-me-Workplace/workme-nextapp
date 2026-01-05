import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { analyzeWorkItemIntent } from '@/lib/services/workops-ai-service'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const analyzeSchema = z.object({
  rawText: z.string().min(1, 'Text is required'),
  category: z.enum(['my_thoughts', 'boss', 'company_stuff']),
})

/**
 * POST /api/workops/item/analyze
 * Analyze user input to understand intent and structure as work item
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    if (!firebaseId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validated = analyzeSchema.parse(body)

    // 3. Analyze with AI
    const analysis = await analyzeWorkItemIntent({
      rawText: validated.rawText,
      category: validated.category,
    })

    console.log('[API POST /api/workops/item/analyze] SUCCESS', {
      category: validated.category,
      itemType: analysis.itemType,
      urgency: analysis.urgency,
    })

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('❌ POST /api/workops/item/analyze error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to analyze work item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

