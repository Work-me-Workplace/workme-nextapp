/**
 * WorkStuff Cause Create (with ingest)
 * 
 * POST /api/workstuff/cause/create - Create cause with raw text ingest
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { createCompanyXWithIngest, getCompanyXRedirectPath } from '@/lib/services/companyx-mapper'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const { rawText, companyUnitId } = await request.json()

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 }
      )
    }

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    // Create with ingest
    const result = await createCompanyXWithIngest(
      prisma,
      'employee_cause',
      rawText,
      workMeId,
      companyUnitId
    )

    return NextResponse.json({
      success: true,
      id: result.id,
      redirectTo: getCompanyXRedirectPath('employee_cause', result.id),
      cause: result.record,
    })
  } catch (error: any) {
    console.error('[WorkStuff Cause Create] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create cause' },
      { status: 500 }
    )
  }
}
