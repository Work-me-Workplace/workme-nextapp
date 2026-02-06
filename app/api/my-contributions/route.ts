import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/my-contributions
 * Get all contributions for current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { searchParams } = new URL(request.url)
    const companyEventId = searchParams.get('companyEventId')
    const companyCampaignId = searchParams.get('companyCampaignId')
    const companyTrainingId = searchParams.get('companyTrainingId')

    const where: any = { workMeId }
    
    if (companyEventId) where.companyEventId = companyEventId
    if (companyCampaignId) where.companyCampaignId = companyCampaignId
    if (companyTrainingId) where.companyTrainingId = companyTrainingId

    const contributions = await prisma.myContribution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        companyEvent: {
          select: { id: true, title: true, eventDate: true }
        },
        companyCampaign: {
          select: { id: true, title: true }
        },
        companyTraining: {
          select: { id: true, title: true, trainingDate: true }
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        whatDid: true,
        results: true,
        skillTopicIds: true,
        companyEventId: true,
        companyCampaignId: true,
        companyTrainingId: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      contributions: contributions || [],
    })
  } catch (error: any) {
    console.error('❌ GetMyContributions error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get contributions', contributions: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/my-contributions
 * Create a new contribution
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const {
      companyEventId,
      companyCampaignId,
      companyTrainingId,
      companyImpactEventId,
      companyCommunityId,
      companyEmployeeCauseId,
      companyBenefitsId,
      companyCareerId,
      companyLeaderEngagementId,
      title,
      description,
      whatDid,
      results,
      skillTopicIds, // Skills demonstrated in this contribution
      startedAt,
      completedAt,
    } = body

    // Validate that at least one CompanyX ID is provided
    // CompanyX models ARE the work stuff - no CompanyWork needed
    const hasCompanyXId = !!(
      companyEventId ||
      companyCampaignId ||
      companyTrainingId ||
      companyImpactEventId ||
      companyCommunityId ||
      companyEmployeeCauseId ||
      companyBenefitsId ||
      companyCareerId ||
      companyLeaderEngagementId
    )

    if (!hasCompanyXId) {
      return NextResponse.json(
        { success: false, error: 'At least one CompanyX ID is required (CompanyEvent, CompanyCampaign, etc.)' },
        { status: 400 },
      )
    }

    // Check if contribution already exists
    const existingWhere: any = { workMeId }
    if (companyEventId) existingWhere.companyEventId = companyEventId
    if (companyCampaignId) existingWhere.companyCampaignId = companyCampaignId
    if (companyTrainingId) existingWhere.companyTrainingId = companyTrainingId
    if (companyImpactEventId) existingWhere.companyImpactEventId = companyImpactEventId
    if (companyCommunityId) existingWhere.companyCommunityId = companyCommunityId
    if (companyEmployeeCauseId) existingWhere.companyEmployeeCauseId = companyEmployeeCauseId
    if (companyBenefitsId) existingWhere.companyBenefitsId = companyBenefitsId
    if (companyCareerId) existingWhere.companyCareerId = companyCareerId
    if (companyLeaderEngagementId) existingWhere.companyLeaderEngagementId = companyLeaderEngagementId

    const existing = await prisma.myContribution.findFirst({ where: existingWhere })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Contribution already exists for this work item' },
        { status: 400 },
      )
    }

    const newContribution = await prisma.myContribution.create({
      data: {
        workMeId,
        companyEventId: companyEventId || null,
        companyCampaignId: companyCampaignId || null,
        companyTrainingId: companyTrainingId || null,
        companyImpactEventId: companyImpactEventId || null,
        companyCommunityId: companyCommunityId || null,
        companyEmployeeCauseId: companyEmployeeCauseId || null,
        companyBenefitsId: companyBenefitsId || null,
        companyCareerId: companyCareerId || null,
        companyLeaderEngagementId: companyLeaderEngagementId || null,
        title: title || null,
        description: description || null,
        whatDid: whatDid || null,
        results: results || null,
        skillTopicIds: skillTopicIds || [],
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
      include: {
        companyEvent: {
          select: { id: true, title: true }
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        whatDid: true,
        results: true,
        skillTopicIds: true,
        companyEventId: true,
        companyCampaignId: true,
        companyTrainingId: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      contribution: newContribution,
    })
  } catch (error: any) {
    console.error('❌ CreateMyContribution error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create contribution' },
      { status: 500 },
    )
  }
}
