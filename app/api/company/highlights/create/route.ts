import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { parseHighlight } from '@/lib/ai/highlightParser'
import { createHighlight } from '@/lib/server/company/highlights'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/company/highlights/create
 * 
 * Body: { rawText: string }
 * 
 * Flow:
 * - Call parseHighlight(rawText)
 * - Insert into CompanyEmployeeHighlight
 * - Return the created record id
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User must set a companyUnit before creating highlights' 
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const { rawText } = body

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'rawText is required and must be a non-empty string' 
        },
        { status: 400 },
      )
    }

    console.log('[API POST /api/company/highlights/create]', {
      workMeId,
      companyUnit,
      rawTextLength: rawText.length,
    })

    // 3. Parse with AI
    const parsed = await parseHighlight(rawText)

    // 4. Create highlight
    const highlight = await createHighlight(parsed, workMeId, companyUnit)

    console.log('[API POST /api/company/highlights/create] SUCCESS', {
      highlightId: highlight.id,
    })

    return NextResponse.json({
      success: true,
      highlightId: highlight.id,
      highlight,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/highlights/create error:', error)

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create highlight',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

