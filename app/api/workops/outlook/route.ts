import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getOrCreateOutlook } from '@/lib/server/workops/outlook'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/workops/outlook
 * Get or create WorkOpsOutlook for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    console.log('[API GET /api/workops/outlook]', { workMeId })

    // 3. Get or create outlook
    const outlook = await getOrCreateOutlook(workMeId)

    console.log('[API GET /api/workops/outlook] SUCCESS', {
      outlookId: outlook.id,
      itemCount: outlook.items.length,
    })

    return NextResponse.json({
      success: true,
      outlook,
    })
  } catch (error: any) {
    console.error('❌ GET /api/workops/outlook error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get outlook',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

