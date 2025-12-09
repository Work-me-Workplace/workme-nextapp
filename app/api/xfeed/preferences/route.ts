/**
 * GET /api/xfeed/preferences
 * 
 * DEPRECATED: This route is deprecated. Use /api/ecosystem/myContacts instead.
 * 
 * Get user's X Feed preferences (organizations, people, hashtags they follow)
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request as Request)
    await loadWorkMe((await verifyAuth(request as Request)).firebaseId)

    // Return empty response - this endpoint is deprecated
    return NextResponse.json({
      success: true,
      organizations: [],
      people: [],
      hashtags: [],
      message: 'This endpoint is deprecated. Use /api/ecosystem/myContacts instead.',
    })
  } catch (error: any) {
    console.error('❌ GET /api/xfeed/preferences error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load preferences' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/xfeed/preferences
 * 
 * DEPRECATED: This route is deprecated. Use /api/ecosystem/savePerson instead.
 * 
 * Save user's X Feed preferences
 */
export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request as Request)
    await loadWorkMe((await verifyAuth(request as Request)).firebaseId)

    // Return success but do nothing - this endpoint is deprecated
    return NextResponse.json({
      success: true,
      message: 'This endpoint is deprecated. Use /api/ecosystem/savePerson instead.',
    })
  } catch (error: any) {
    console.error('❌ POST /api/xfeed/preferences error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save preferences' },
      { status: 500 }
    )
  }
}
