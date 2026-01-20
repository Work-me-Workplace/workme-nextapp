/**
 * Parse Workforce Stuff Item API Route
 * 
 * Parses content using the selected type (no inference)
 * This endpoint ONLY does parsing - no database writes
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import type { ContextType } from '@/lib/types/context-type'
import { isValidContextType } from '@/lib/types/context-type'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const rawText = body?.rawText
    const type = body?.type

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'type is required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!isValidContextType(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type: ${type}` },
        { status: 400 }
      )
    }

    // Parse the content using the selected type
    const parsed = await parseCompanyXContent(rawText, type as ContextType)

    // Return parsed data
    return NextResponse.json({
      success: true,
      parsedData: parsed.data,
      type: parsed.type,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Parse Workforce Stuff] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse content' },
      { status: 500 }
    )
  }
}

