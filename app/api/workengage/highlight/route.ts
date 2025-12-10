import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import * as workEngage from '@/lib/workengage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workengage/highlight
 * 
 * Get highlights (read-only, pulls from CompanyEmployeeHighlight)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    await verifyAuth(request as Request)

    // 2. Get highlights
    const highlights = await workEngage.getHighlights()

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

