import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getHighlight, updateHighlight } from '@/lib/server/company/highlights'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/company/highlights/[id]
 * Get a single highlight by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    await verifyAuth(request as Request)
    
    const { id } = await params

    console.log('[API GET /api/company/highlights/[id]]', { id })

    const highlight = await getHighlight(id)

    console.log('[API GET /api/company/highlights/[id]] SUCCESS', { id })

    return NextResponse.json({
      success: true,
      highlight,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/highlights/[id] error:', error)

    const status = error.message === 'Highlight not found' ? 404 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get highlight',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * PUT /api/company/highlights/[id]
 * Update a highlight
 * 
 * Allow user edits to any field except id/createdAt/createdByWorkMeId
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params
    const body = await request.json()

    console.log('[API PUT /api/company/highlights/[id]]', {
      id,
      workMeId,
      bodyKeys: Object.keys(body),
    })

    // Remove fields that shouldn't be updated
    const { id: _, createdAt, createdByWorkMeId, ...updateData } = body

    const updated = await updateHighlight(id, updateData, workMeId)

    console.log('[API PUT /api/company/highlights/[id]] SUCCESS', { id })

    return NextResponse.json({
      success: true,
      highlight: updated,
    })
  } catch (error: any) {
    console.error('❌ PUT /api/company/highlights/[id] error:', error)

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 
      (error.message?.includes('not found') ? 404 : 401) : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update highlight',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

