/**
 * POST /api/signalingest/clip/parse
 * 
 * Clip Parse Signal - CHINFO clip parser
 * 
 * STUB: To be implemented
 * 
 * Purpose: Paste Navy/DoD daily news clips → AI extract units/platforms/countries/programs/contracts/actions/risks
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    console.log('[API POST /api/signalingest/clip/parse] STUB', {
      workMeId: workMe.id,
    })

    return NextResponse.json({
      success: false,
      error: 'Clip Parse endpoint not yet implemented',
    }, { status: 501 })
  } catch (error: any) {
    console.error('❌ POST /api/signalingest/clip/parse error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse clip' },
      { status: 500 }
    )
  }
}

