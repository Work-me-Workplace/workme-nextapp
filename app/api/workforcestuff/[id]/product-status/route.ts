/**
 * API Route: GET /api/workforcestuff/[id]/product-status
 * 
 * Checks which products exist for a given CompanyX item (by ID).
 * Returns status for each product type: exists (true/false) and productId if exists.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Map CompanyX type to FK field name */
const COMPANYX_TYPE_TO_FK: Record<string, string> = {
  training: 'companyTrainingId',
  event: 'companyEventId',
  campaign: 'companyCampaignId',
  impact: 'companyImpactEventId',
  impact_event: 'companyImpactEventId',
  community: 'companyCommunityId',
  benefits: 'companyBenefitsId',
  career: 'companyCareerId',
  employee_cause: 'companyEmployeeCauseId',
  leader_engagement: 'companyLeaderEngagementId',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || ''

    // Determine FK field name from type
    const fkField = COMPANYX_TYPE_TO_FK[type]
    if (!fkField) {
      return NextResponse.json({
        success: true,
        statuses: [
          { productTypeId: 'email_digest', exists: false },
          { productTypeId: 'digital_signage', exists: false },
          { productTypeId: 'flyer_poster', exists: false },
          { productTypeId: 'senior_leader_email', exists: false },
          { productTypeId: 'comms_plan', exists: false },
        ],
      })
    }

    // Build where clause for FK lookup
    const whereClause: any = { [fkField]: id }

    // Check each product type for existence via FK lookup
    const statuses = await Promise.all([
      // Email Digest - EmailDigestItem has companyTrainingId, companyEventId, etc.
      prisma.emailDigestItem.findFirst({
        where: whereClause,
        select: { id: true, oneOffEmailId: true },
      }).then(r => ({
        productTypeId: 'email_digest',
        exists: !!r,
        productId: r?.oneOffEmailId || r?.id,
      })),

      // Digital Signage - Check unified ProductDigitalSignWorkforceStuff model
      prisma.productDigitalSignWorkforceStuff.findFirst({
        where: {
          OR: [
            { companyEventId: id },
            { companyTrainingId: id },
            { companyCampaignId: id },
            { companyBenefitsId: id },
            { companyCareerId: id },
            { companyCommunityId: id },
            { companyImpactEventId: id },
            { companyEmployeeCauseId: id },
            { companyLeaderEngagementId: id },
          ]
        },
        select: { id: true, digitalSignId: true },
      }).then(r => ({
        productTypeId: 'digital_signage',
        exists: !!r,
        productId: r?.digitalSignId || r?.id,
      })),

      // Flyer/Poster - no FK model found, can't check
      Promise.resolve({
        productTypeId: 'flyer_poster',
        exists: false,
        productId: undefined,
      }),

      // Senior Leader Email - no CompanyX FK, can't check
      Promise.resolve({
        productTypeId: 'senior_leader_email',
        exists: false,
        productId: undefined,
      }),

      // Comms Plan - no CompanyX FK, can't check
      Promise.resolve({
        productTypeId: 'comms_plan',
        exists: false,
        productId: undefined,
      }),
    ])

    return NextResponse.json({
      success: true,
      statuses,
    })
  } catch (error: any) {
    console.error('[API GET /api/workforcestuff/[id]/product-status] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check product status' },
      { status: 500 }
    )
  }
}
