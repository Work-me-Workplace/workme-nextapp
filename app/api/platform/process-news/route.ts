import { NextResponse } from 'next/server'
import { processNewsArticle, inferPlatformChanges, applyPlatformChanges } from '@/lib/services/platform-update-service'

/**
 * POST /api/platform/process-news
 * Process a news article for a platform product
 * 
 * Body: {
 *   platformProductId: string
 *   rawText: string
 *   sourceUrl?: string
 *   autoApplyUpdates?: boolean
 * }
 */
export async function POST(request: Request) {
  try {
    const { platformProductId, rawText, sourceUrl, autoApplyUpdates } = await request.json()

    if (!platformProductId || !rawText) {
      return NextResponse.json(
        { success: false, error: 'platformProductId and rawText are required' },
        { status: 400 }
      )
    }

    const result = await processNewsArticle(platformProductId, rawText, {
      sourceUrl,
      autoApplyUpdates: autoApplyUpdates === true,
    })

    return NextResponse.json({
      success: true,
      statement: result.statement,
      update: result.update,
      platformUpdated: result.platformUpdated,
    })
  } catch (error: any) {
    console.error('Failed to process news article:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process news article' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/platform/infer-changes?platformProductId=xxx
 * Infer platform changes from recent updates
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const platformProductId = searchParams.get('platformProductId')

    if (!platformProductId) {
      return NextResponse.json(
        { success: false, error: 'platformProductId is required' },
        { status: 400 }
      )
    }

    const result = await inferPlatformChanges(platformProductId)

    return NextResponse.json({
      success: true,
      suggestedChanges: result.suggestedChanges,
      confidence: result.confidence,
    })
  } catch (error: any) {
    console.error('Failed to infer platform changes:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to infer changes' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/platform/apply-changes
 * Apply suggested changes to platform product
 * 
 * Body: {
 *   platformProductId: string
 *   changes: {
 *     intendedTotalUnits?: number
 *     programStatus?: string
 *     currentProgressEstimate?: number
 *   }
 * }
 */
export async function PUT(request: Request) {
  try {
    const { platformProductId, changes } = await request.json()

    if (!platformProductId || !changes) {
      return NextResponse.json(
        { success: false, error: 'platformProductId and changes are required' },
        { status: 400 }
      )
    }

    await applyPlatformChanges(platformProductId, changes)

    return NextResponse.json({
      success: true,
      message: 'Changes applied successfully',
    })
  } catch (error: any) {
    console.error('Failed to apply platform changes:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to apply changes' },
      { status: 500 }
    )
  }
}
