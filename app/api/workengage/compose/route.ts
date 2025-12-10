import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import * as workEngage from '@/lib/workengage'

export const dynamic = 'force-dynamic'

/**
 * POST /api/workengage/compose
 * 
 * Creates a new engagement message
 * 
 * Body: {
 *   message: string,
 *   highlightId?: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { message, highlightId } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'message is required' 
        },
        { status: 400 },
      )
    }

    // 3. Create message
    const engageMessage = await workEngage.createMessage(
      {
        message,
        highlightId: highlightId || null,
      },
      workMeId
    )

    return NextResponse.json({
      success: true,
      data: engageMessage,
    })
  } catch (error: any) {
    console.error('[workengage/compose] ERROR:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create engagement message' 
      },
      { status: 500 },
    )
  }
}

