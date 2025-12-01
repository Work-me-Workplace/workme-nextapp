/**
 * POST /api/signalingest/x/feed
 * 
 * X Feed Signal - Live Twitter/X feed signals
 * 
 * STUB: To be implemented
 * 
 * Purpose: Pull feed → AI classify → Normalize
 * High frequency, public-facing signals from X/Twitter
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    console.log('[API POST /api/signalingest/x/feed] STUB', {
      workMeId: workMe.id,
    })

    return NextResponse.json({
      success: false,
      error: 'X Feed endpoint not yet implemented',
    }, { status: 501 })
  } catch (error: any) {
    console.error('❌ POST /api/signalingest/x/feed error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process X feed' },
      { status: 500 }
    )
  }
}

