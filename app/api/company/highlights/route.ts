import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { listHighlights } from '@/lib/server/company/highlights'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/company/highlights
 * List all highlights for the authenticated user's company unit
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { companyUnit } = workMe

    console.log('[API GET /api/company/highlights]', {
      companyUnit,
    })

    const highlights = await listHighlights(companyUnit)

    console.log('[API GET /api/company/highlights] SUCCESS', {
      count: highlights.length,
    })

    return NextResponse.json({
      success: true,
      highlights,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/highlights error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to list highlights',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

