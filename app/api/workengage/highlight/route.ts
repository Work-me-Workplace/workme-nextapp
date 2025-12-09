import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import * as workEngage from '@/lib/workengage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workengage/highlight
 * 
 * Get highlights (read-only, pulls from CompanyEmployeeHighlight)
 * Optionally filters by companyUnit query param
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity (for companyUnit if needed)
    const workMe = await loadWorkMe(firebaseId)
    const { companyUnit } = workMe

    // 3. Get query params
    const { searchParams } = new URL(request.url)
    const filterCompanyUnit = searchParams.get('companyUnit') || companyUnit

    // 4. Get highlights
    const highlights = await workEngage.getHighlights(filterCompanyUnit || null)

    return NextResponse.json({
      success: true,
      data: highlights,
    })
  } catch (error: any) {
    console.error('[workengage/highlight] ERROR:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get highlights' 
      },
      { status: 500 },
    )
  }
}

