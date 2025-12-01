/**
 * POST /api/signalingest/google/scan
 * 
 * Google Scan Signal - Keyword-based web/news sweep
 * 
 * User submits a keyword → broad web/news search → ranked results
 * 
 * NO AI inference, NO DB writes, NO Redis
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { searchPublicSignal } from '@/lib/services/signalSearch'
import type { GoogleScanRequest, GoogleScanResponse, GoogleScanError } from '@/lib/types/signal'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    console.log('[API POST /api/signalingest/google/scan]', {
      workMeId,
    })

    const body: GoogleScanRequest = await request.json()
    const { query } = body

    if (!query || !query.trim()) {
      return NextResponse.json<GoogleScanError>(
        { success: false, error: 'query is required' },
        { status: 400 }
      )
    }

    // 3. Perform OSINT search
    const results = await searchPublicSignal(query.trim())

    const response: GoogleScanResponse = {
      success: true,
      results,
      totalResults: results.length,
    }

    console.log('[API POST /api/signalingest/google/scan] SUCCESS', {
      workMeId,
      queryLength: query.length,
      resultsCount: results.length,
    })

    return NextResponse.json<GoogleScanResponse>(response)
  } catch (error: any) {
    console.error('❌ POST /api/signalingest/google/scan error:', error)
    
    // Handle auth errors
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json<GoogleScanError>(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json<GoogleScanError>(
      {
        success: false,
        error: error.message || 'Failed to scan signal',
      },
      { status: 500 }
    )
  }
}

