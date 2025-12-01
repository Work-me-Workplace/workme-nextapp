/**
 * POST /api/signalingest/senior/parse
 * 
 * Senior Email Signal - SES/Flag email context extraction
 * 
 * STUB: To be implemented
 * 
 * Purpose: Paste email text → Extract entities → OSINT cross-check → Return explanation
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    console.log('[API POST /api/signalingest/senior/parse] STUB', {
      workMeId: workMe.id,
    })

    return NextResponse.json({
      success: false,
      error: 'Senior Email Parse endpoint not yet implemented',
    }, { status: 501 })
  } catch (error: any) {
    console.error('❌ POST /api/signalingest/senior/parse error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse senior email' },
      { status: 500 }
    )
  }
}

