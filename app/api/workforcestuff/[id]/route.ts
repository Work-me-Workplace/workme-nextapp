/**
 * Unified API Route: Fetch any Workforce Stuff item by ID
 * 
 * Tries to find the item across all CompanyX models
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function isPast(startDate: string | null, endDate: string | null): boolean {
  const now = new Date()
  if (endDate) return new Date(endDate) < now
  if (startDate) return new Date(startDate) < now
  return false
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

    // Try to find the item in each CompanyX model
    const [training, event, campaign, impactEvent, community, benefits, career, employeeCause, leaderEngagement] = await Promise.all([
      prisma.companyTraining.findFirst({ where: { id, companyId } }),
      prisma.companyEvent.findFirst({ where: { id, companyId } }),
      prisma.companyCampaign.findFirst({ where: { id, companyId } }),
      prisma.companyImpactEvent.findFirst({ where: { id, companyId } }),
      prisma.companyCommunity.findFirst({ where: { id, companyId } }),
      prisma.companyBenefits.findFirst({ where: { id, companyId } }),
      prisma.companyCareer.findFirst({ where: { id, companyId } }),
      prisma.companyEmployeeCause.findFirst({ where: { id, companyId } }),
      prisma.companyLeaderEngagement.findFirst({ where: { id, companyId } }),
    ])

    // Find which one exists
    if (training) {
      const startDate = training.trainingDate?.toISOString() || null
      const endDate = training.isSelfPaced && training.completionDeadline
        ? training.completionDeadline.toISOString()
        : startDate
      const past = isPast(startDate, endDate)
      return NextResponse.json({
        success: true,
        item: {
          ...training,
          type: 'training',
          startDate,
          endDate,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (event) {
      const startDate = event.eventDate?.toISOString() || null
      const endDate = startDate
      const past = isPast(startDate, endDate)
      return NextResponse.json({
        success: true,
        item: {
          ...event,
          type: 'event',
          startDate,
          endDate,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (campaign) {
      const startDate = campaign.windowStart?.toISOString() || null
      const endDate = campaign.windowEnd?.toISOString() || null
      const past = isPast(startDate, endDate)
      return NextResponse.json({
        success: true,
        item: {
          ...campaign,
          type: 'campaign',
          startDate,
          endDate,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (impactEvent) {
      const startDate = impactEvent.effectiveDate?.toISOString() || null
      const past = isPast(startDate, null)
      return NextResponse.json({
        success: true,
        item: {
          ...impactEvent,
          type: 'impact',
          startDate,
          endDate: null,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (community) {
      const startDate = community.date?.toISOString() || null
      const past = isPast(startDate, null)
      return NextResponse.json({
        success: true,
        item: {
          ...community,
          type: 'community',
          startDate,
          endDate: null,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (benefits) {
      const startDate = benefits.windowStart?.toISOString() || null
      const endDate = benefits.windowEnd?.toISOString() || null
      const past = isPast(startDate, endDate)
      return NextResponse.json({
        success: true,
        item: {
          ...benefits,
          type: 'benefit',
          startDate,
          endDate,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (career) {
      const startDate = career.windowStart?.toISOString() || null
      const endDate = career.windowEnd?.toISOString() || null
      const past = isPast(startDate, endDate)
      return NextResponse.json({
        success: true,
        item: {
          ...career,
          type: 'career',
          startDate,
          endDate,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (employeeCause) {
      const startDate = employeeCause.windowStart?.toISOString() || null
      const endDate = employeeCause.windowEnd?.toISOString() || null
      const past = isPast(startDate, endDate)
      return NextResponse.json({
        success: true,
        item: {
          ...employeeCause,
          type: 'cause',
          startDate,
          endDate,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }
    if (leaderEngagement) {
      const startDate = leaderEngagement.engagementDate?.toISOString() || null
      const past = isPast(startDate, null)
      return NextResponse.json({
        success: true,
        item: {
          ...leaderEngagement,
          type: 'leader_engagement',
          startDate,
          endDate: null,
          status: past ? 'ARCHIVED' : 'ACTIVE',
          archived: past,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Item not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('[WorkforceStuff Detail] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body = await request.json()
    const { data, type } = body

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Type is required' },
        { status: 400 }
      )
    }

    // Map type to model name and find the item
    const modelMap: Record<string, string> = {
      training: 'companyTraining',
      event: 'companyEvent',
      campaign: 'companyCampaign',
      impact: 'companyImpactEvent',
      community: 'companyCommunity',
      benefit: 'companyBenefits',
      career: 'companyCareer',
      cause: 'companyEmployeeCause',
      leader_engagement: 'companyLeaderEngagement',
    }

    const modelName = modelMap[type]
    if (!modelName) {
      return NextResponse.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      )
    }

    // Verify item exists and belongs to company
    const existing = await (prisma as any)[modelName].findFirst({
      where: { id, companyId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = { ...data }
    
    // Preserve ingest fields if they exist
    if (existing.ingestRawText !== undefined) {
      updateData.ingestRawText = existing.ingestRawText
    }
    if (existing.ingestType !== undefined) {
      updateData.ingestType = existing.ingestType
    }
    if (existing.ingestCreatedAt !== undefined) {
      updateData.ingestCreatedAt = existing.ingestCreatedAt
    }
    if (existing.summary !== undefined && !data.summary) {
      updateData.summary = existing.summary
    }
    
    // Status/archived removed: CompanyX is date-only; current vs past derived from dates in API/UI.
    if (updateData.status !== undefined) delete updateData.status
    if (updateData.archived !== undefined) delete updateData.archived

    // Update the item
    const updated = await (prisma as any)[modelName].update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      item: updated,
    })
  } catch (error: any) {
    console.error('[WorkforceStuff Update] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    // Map type to model name
    const modelMap: Record<string, string> = {
      training: 'companyTraining',
      event: 'companyEvent',
      campaign: 'companyCampaign',
      impact: 'companyImpactEvent',
      community: 'companyCommunity',
      benefit: 'companyBenefits',
      career: 'companyCareer',
      cause: 'companyEmployeeCause',
      leader_engagement: 'companyLeaderEngagement',
    }

    // If type is provided, use it directly (more efficient)
    if (type && modelMap[type]) {
      const modelName = modelMap[type]
      const existing = await (prisma as any)[modelName].findFirst({
        where: { id, companyId },
      })

      if (existing) {
        await (prisma as any)[modelName].delete({
          where: { id },
        })

        return NextResponse.json({
          success: true,
          message: `${type} deleted successfully`,
        })
      }
    } else {
      // Fallback: Try to find and delete from each model
      for (const [typeKey, modelName] of Object.entries(modelMap)) {
        const existing = await (prisma as any)[modelName].findFirst({
          where: { id, companyId },
        })

        if (existing) {
          await (prisma as any)[modelName].delete({
            where: { id },
          })

          return NextResponse.json({
            success: true,
            message: `${typeKey} deleted successfully`,
          })
        }
      }
    }

    return NextResponse.json(
      { success: false, error: 'Item not found' },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('[WorkforceStuff Delete] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete item' },
      { status: 500 }
    )
  }
}

