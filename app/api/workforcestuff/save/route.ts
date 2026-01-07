/**
 * Save Workforce Stuff Item API Route
 * 
 * Modular ingest pattern:
 * 1. Create CompanyX with ingest snapshot (using createCompanyXWithIngest)
 * 2. Parse the content (using parseCompanyXContent - calls the parser)
 * 3. Update the record with parsed data
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { CONTEXT_TYPE_TO_ROUTE, createCompanyXWithIngest } from '@/lib/services/companyx-mapper'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import { saveCompanyX } from '@/lib/services/companyx-save-handlers'
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
    const type = body?.type
    const rawText = body?.rawText

    // Defensive validation - never assume fields exist
    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'type is required and must be a string' },
        { status: 400 }
      )
    }

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'rawText is required and must be a non-empty string' },
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

    // STEP 1: Create CompanyX with ingest snapshot (modular ingest pattern)
    const ingestResult = await createCompanyXWithIngest(
      prisma,
      type as ContextType,
      rawText,
      workMeId,
      companyId
    )

    // STEP 2: Parse the content (calls the parser)
    const parsed = await parseCompanyXContent(rawText, type as ContextType)

    // STEP 3: Update the record with parsed data using modular save handlers
    const saveResult = await saveCompanyX(prisma, ingestResult, parsed)

    // Build redirect path - defensive check
    const routeSegment = CONTEXT_TYPE_TO_ROUTE[type as ContextType]
    if (!routeSegment || typeof routeSegment !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid route segment for type' },
        { status: 500 }
      )
    }

    if (!saveResult?.id || typeof saveResult.id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid save result' },
        { status: 500 }
      )
    }

    const redirectTo = `/mycompany/workforcestuff/${routeSegment}/${saveResult.id}`

    return NextResponse.json({
      success: true,
      id: saveResult.id,
      type,
      redirectTo,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Save Workforce Stuff] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save workforce item' },
      { status: 500 }
    )
  }
}


