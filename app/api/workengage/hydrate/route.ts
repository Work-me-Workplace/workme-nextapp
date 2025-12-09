import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import * as workEngage from '@/lib/workengage'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workengage/hydrate
 * 
 * Hydrate a template with highlight data
 * 
 * Body: {
 *   templateBody: string,
 *   highlightId?: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    await verifyAuth(request as Request)

    const body = await request.json()
    const { templateBody, highlightId } = body

    if (!templateBody || templateBody.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'templateBody is required' 
        },
        { status: 400 },
      )
    }

    // 2. Get highlight if provided
    let highlight = null
    if (highlightId) {
      highlight = await workEngage.getHighlightForHydration(highlightId)
    }

    // 3. Hydrate template
    const hydrated = workEngage.hydrateTemplate(templateBody, highlight)

    return NextResponse.json({
      success: true,
      data: {
        hydrated,
      },
    })
  } catch (error: any) {
    console.error('[workengage/hydrate] ERROR:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to hydrate template' 
      },
      { status: 500 },
    )
  }
}

