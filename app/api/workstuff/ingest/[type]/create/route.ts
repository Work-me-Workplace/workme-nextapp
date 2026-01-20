import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { createCompanyXWithIngest, getCompanyXRedirectPath } from '@/lib/services/companyx-mapper'
import type { ContextType } from '@/lib/types/context-type'
import { isValidContextType } from '@/lib/types/context-type'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 1: Create CompanyX model with Ingest Snapshot (param-based)
 *
 * Creates a new CompanyX row with ONLY ingest fields populated.
 * All "real" fields remain null until Stage 2.
 *
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: companyId from payload (NOT from WorkMe)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const { type } = await params
    const { rawText, companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      )
    }

    if (!rawText || typeof rawText !== 'string') {
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

    if (!isValidContextType(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be a CompanyX ContextType.` },
        { status: 400 }
      )
    }

    const result = await createCompanyXWithIngest(
      prisma,
      type as ContextType,
      rawText,
      workMeId,
      companyId
    )

    const response: any = {
      success: true,
      redirectTo: getCompanyXRedirectPath(type as ContextType, result.id),
      [result.modelName]: result.record,
    }

    const idFieldMap: Record<string, string> = {
      companyTraining: 'trainingId',
      companyCareer: 'careerId',
      companyEvent: 'eventId',
      companyCampaign: 'campaignId',
      companyImpactEvent: 'impactEventId',
      companyCommunity: 'communityId',
      companyBenefits: 'benefitsId',
      companyEmployeeCause: 'employeeCauseId',
    }

    const idField = idFieldMap[result.modelName]
    if (idField) {
      response[idField] = result.id
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Create CompanyX Param] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create CompanyX record' },
      { status: 500 }
    )
  }
}

