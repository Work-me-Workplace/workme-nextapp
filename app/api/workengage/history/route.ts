import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import * as workEngage from '@/lib/workengage'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workengage/history
 * 
 * Get engagement message history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Get history
    const messages = await workEngage.getHistory(workMeId)

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error: any) {
    console.error('[workengage/history] ERROR:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get history' 
      },
      { status: 500 },
    )
  }
}

