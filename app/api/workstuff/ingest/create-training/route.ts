import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { createCompanyXWithIngest, getCompanyXRedirectPath, CONTEXT_TYPE_TO_MODEL } from '@/lib/services/companyx-mapper'
import type { ContextType } from '@/lib/types/context-type'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * STAGE 1: Create CompanyX model with Ingest Snapshot
 * 
 * Creates a new CompanyX row with ONLY ingest fields populated.
 * All "real" fields remain null until Stage 2.
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: companyId from payload (NOT from WorkMe)
 * 
 * Supports all CompanyX types: training, career, event, campaign, impact_event, 
 * community, benefits, employee_cause
 */
export async function POST(request: NextRequest) {
  try {
    // AUTH: WorkMe-only
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    // SCOPE: companyId from payload
    const { rawText, selectedType, companyId } = await request.json()

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

    if (!selectedType || typeof selectedType !== 'string') {
      return NextResponse.json(
        { success: false, error: 'selectedType is required' },
        { status: 400 }
      )
    }

    // Validate selectedType is a valid ContextType
    const validTypes: ContextType[] = [
      'training',
      'career',
      'event',
      'campaign',
      'impact_event',
      'community',
      'benefits',
      'employee_cause',
    ]

    if (!validTypes.includes(selectedType as ContextType)) {
      return NextResponse.json(
        { success: false, error: `Invalid selectedType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create CompanyX model using mapper service
    const result = await createCompanyXWithIngest(
      prisma,
      selectedType as ContextType,
      rawText,
      workMeId,
      companyId
    )

    // Build response with type-specific ID field
    const response: any = {
      success: true,
      redirectTo: getCompanyXRedirectPath(selectedType as ContextType, result.id),
      [result.modelName]: result.record,
    }

    // Add type-specific ID field for backward compatibility
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
    console.error('[Create CompanyX] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create CompanyX record' },
      { status: 500 }
    )
  }
}

