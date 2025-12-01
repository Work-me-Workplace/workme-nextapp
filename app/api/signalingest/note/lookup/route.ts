/**
 * POST /api/signalingest/note/lookup
 * 
 * Note Lookup Signal - "I heard this in a meeting"
 * 
 * User submits a phrase fragment → OSINT lookup to determine if it's publicly verifiable
 * 
 * NO AI inference, NO hallucination, NO DB writes
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { searchPublicSignal } from '@/lib/services/signalSearch'
import type { NoteLookupRequest, NoteLookupResponse, NoteLookupError } from '@/lib/types/signal'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    console.log('[API POST /api/signalingest/note/lookup]', {
      workMeId,
    })

    const body: NoteLookupRequest = await request.json()
    const { signal } = body

    if (!signal || !signal.trim()) {
      return NextResponse.json<NoteLookupError>(
        { success: false, error: 'signal is required' },
        { status: 400 }
      )
    }

    // 3. Perform OSINT lookup
    const results = await searchPublicSignal(signal.trim())

    // 4. Determine if signal is publicly verifiable
    // If we have results, it's public. If no results, it might be internal/not public.
    const isPublic = results.length > 0

    const response: NoteLookupResponse = {
      success: true,
      public: isPublic,
      results,
    }

    console.log('[API POST /api/signalingest/note/lookup] SUCCESS', {
      workMeId,
      signalLength: signal.length,
      isPublic,
      resultsCount: results.length,
    })

    return NextResponse.json<NoteLookupResponse>(response)
  } catch (error: any) {
    console.error('❌ POST /api/signalingest/note/lookup error:', error)
    
    // Handle auth errors
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json<NoteLookupError>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<NoteLookupError>(
      {
        success: false,
        error: error.message || 'Failed to lookup signal',
      },
      { status: 500 }
    )
  }
}

