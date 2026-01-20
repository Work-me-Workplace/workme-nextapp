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
    const [training, event, campaign, impactEvent, community, benefits, career, employeeCause] = await Promise.all([
      prisma.companyTraining.findFirst({ where: { id, companyId } }),
      prisma.companyEvent.findFirst({ where: { id, companyId } }),
      prisma.companyCampaign.findFirst({ where: { id, companyId } }),
      prisma.companyImpactEvent.findFirst({ where: { id, companyId } }),
      prisma.companyCommunity.findFirst({ where: { id, companyId } }),
      prisma.companyBenefits.findFirst({ where: { id, companyId } }),
      prisma.companyCareer.findFirst({ where: { id, companyId } }),
      prisma.companyEmployeeCause.findFirst({ where: { id, companyId } }),
    ])

    // Find which one exists
    if (training) {
      return NextResponse.json({
        success: true,
        item: {
          ...training,
          type: 'training',
          startDate: training.trainingDate?.toISOString() || null,
          endDate: training.trainingDate?.toISOString() || null,
        },
      })
    }
    if (event) {
      return NextResponse.json({
        success: true,
        item: {
          ...event,
          type: 'event',
          startDate: event.eventDate?.toISOString() || null,
          endDate: event.eventDate?.toISOString() || null,
        },
      })
    }
    if (campaign) {
      return NextResponse.json({
        success: true,
        item: {
          ...campaign,
          type: 'campaign',
          startDate: campaign.windowStart?.toISOString() || null,
          endDate: campaign.windowEnd?.toISOString() || null,
        },
      })
    }
    if (impactEvent) {
      return NextResponse.json({
        success: true,
        item: {
          ...impactEvent,
          type: 'impact',
          startDate: impactEvent.effectiveDate?.toISOString() || null,
          endDate: null,
        },
      })
    }
    if (community) {
      return NextResponse.json({
        success: true,
        item: {
          ...community,
          type: 'community',
          startDate: community.date?.toISOString() || null,
          endDate: null,
        },
      })
    }
    if (benefits) {
      return NextResponse.json({
        success: true,
        item: {
          ...benefits,
          type: 'benefit',
          startDate: benefits.windowStart?.toISOString() || null,
          endDate: benefits.windowEnd?.toISOString() || null,
        },
      })
    }
    if (career) {
      return NextResponse.json({
        success: true,
        item: {
          ...career,
          type: 'career',
          startDate: null,
          endDate: null,
        },
      })
    }
    if (employeeCause) {
      return NextResponse.json({
        success: true,
        item: {
          ...employeeCause,
          type: 'cause',
          startDate: employeeCause.windowStart?.toISOString() || null,
          endDate: employeeCause.windowEnd?.toISOString() || null,
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
    
    // Convert archived boolean to status enum if provided (backward compatibility)
    if (data.archived !== undefined) {
      updateData.status = data.archived ? 'ARCHIVED' : 'ACTIVE'
      delete updateData.archived // Remove boolean field
    }
    
    // Ensure status is valid enum value if provided
    if (updateData.status && !['ACTIVE', 'ARCHIVED', 'DRAFT', 'EXPIRED'].includes(updateData.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value. Must be ACTIVE, ARCHIVED, DRAFT, or EXPIRED' },
        { status: 400 }
      )
    }

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
    }

    // Try to find and delete from each model
    for (const [type, modelName] of Object.entries(modelMap)) {
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

