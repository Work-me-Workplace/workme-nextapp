/**
 * API Route: POST /api/workforcestuff/[id]/generate-digital-signage
 * 
 * Generate digital signage from a workforce stuff item (CompanyX model)
 * Creates ProductDigitalSign with ProductDigitalSignWorkforceStuff variant
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || ''

    // Map workforce stuff type to CompanyX model and FK field
    const TYPE_TO_FK: Record<string, { model: string; fkField: string }> = {
      event: { model: 'companyEvent', fkField: 'companyEventId' },
      training: { model: 'companyTraining', fkField: 'companyTrainingId' },
      campaign: { model: 'companyCampaign', fkField: 'companyCampaignId' },
      benefit: { model: 'companyBenefits', fkField: 'companyBenefitsId' },
      benefits: { model: 'companyBenefits', fkField: 'companyBenefitsId' },
      career: { model: 'companyCareer', fkField: 'companyCareerId' },
      community: { model: 'companyCommunity', fkField: 'companyCommunityId' },
      impact: { model: 'companyImpactEvent', fkField: 'companyImpactEventId' },
      impact_event: { model: 'companyImpactEvent', fkField: 'companyImpactEventId' },
      cause: { model: 'companyEmployeeCause', fkField: 'companyEmployeeCauseId' },
      employee_cause: { model: 'companyEmployeeCause', fkField: 'companyEmployeeCauseId' },
      leader_engagement: { model: 'companyLeaderEngagement', fkField: 'companyLeaderEngagementId' },
    }

    const typeConfig = TYPE_TO_FK[type]
    if (!typeConfig) {
      return NextResponse.json(
        { success: false, error: `Unsupported workforce stuff type: ${type}` },
        { status: 400 }
      )
    }

    // Fetch the CompanyX item
    const companyXItem = await (prisma as any)[typeConfig.model].findFirst({
      where: { id, companyId },
    })

    if (!companyXItem) {
      return NextResponse.json(
        { success: false, error: `${typeConfig.model} not found` },
        { status: 404 }
      )
    }

    // Extract common fields from CompanyX item
    const title = companyXItem.title || companyXItem.eventName || 'Untitled'
    const description = companyXItem.description || companyXItem.summary || null
    
    // Normalize date fields (different CompanyX models use different field names)
    let date: Date | null = null
    let endDate: Date | null = null
    
    if (type === 'event') {
      date = companyXItem.eventDate || null
    } else if (type === 'training') {
      date = companyXItem.trainingDate || null
    } else if (type === 'campaign' || type === 'benefit' || type === 'benefits' || type === 'cause') {
      date = companyXItem.windowStart || null
      endDate = companyXItem.windowEnd || null
    } else if (type === 'impact' || type === 'impact_event') {
      date = companyXItem.effectiveDate || null
    } else if (type === 'community') {
      date = companyXItem.date || null
    }

    const startTime = companyXItem.startTime || null
    const endTime = companyXItem.endTime || null
    const location = companyXItem.location || null
    
    // Event-specific fields
    const eventItems = type === 'event' ? (companyXItem.eventItems || []) : []

    // Create digital signage product with unified model
    const signage = await prisma.productDigitalSign.create({
      data: {
        signType: DigitalSignType.COMPANY_EVENT, // Reuse COMPANY_EVENT type for all workforce stuff
        companyUnit: null,
        createdByWorkMeId: workMe.id,
        workforceStuff: {
          create: {
            [typeConfig.fkField]: id, // Set the appropriate FK
            title,
            description,
            date,
            endDate,
            startTime,
            endTime,
            location,
            eventItems, // Only populated for events
          }
        }
      },
      include: {
        workforceStuff: {
          include: {
            companyEvent: type === 'event',
            companyTraining: type === 'training',
            companyCampaign: type === 'campaign',
            companyBenefits: type === 'benefit' || type === 'benefits',
            companyCareer: type === 'career',
            companyCommunity: type === 'community',
            companyImpactEvent: type === 'impact' || type === 'impact_event',
            companyEmployeeCause: type === 'cause' || type === 'employee_cause',
            companyLeaderEngagement: type === 'leader_engagement',
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      signage,
      message: 'Digital signage created successfully',
    })
  } catch (error: any) {
    console.error('[API POST /api/workforcestuff/[id]/generate-digital-signage] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate digital signage' },
      { status: 500 }
    )
  }
}
