/**
 * Unified WorkStuff API - Main List Endpoint
 * 
 * GET /api/workstuff - List all WorkStuff items (all types)
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: companyUnitId from query
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireWorkMeAuth(request)

    const { searchParams } = new URL(request.url)
    const companyUnitId = searchParams.get('companyUnitId')

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId query parameter is required' },
        { status: 400 }
      )
    }

    // Fetch all CompanyX models scoped by companyUnitId
    const [trainings, events, campaigns, impactEvents, community, benefits, careers, employeeCauses] = await Promise.all([
      prisma.companyTraining.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { trainingDate: 'asc' },
      }),
      prisma.companyEvent.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCampaign.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyImpactEvent.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCommunity.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyBenefits.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCareer.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEmployeeCause.findMany({
        where: { companyUnit: companyUnitId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Normalize all items into unified WorkStuffItem shape
    const normalizedItems = [
      ...trainings.map((training) => ({
        id: training.id,
        type: 'training' as const,
        category: 'Training',
        title: training.title ?? 'Untitled Training',
        summary: training.description ?? '',
        startDate: training.trainingDate ? training.trainingDate.toISOString() : null,
        endDate: training.trainingDate ? training.trainingDate.toISOString() : null,
        status: training.ingestStatus === 'saved' ? 'active' : (training.ingestStatus === 'pending' ? 'active' : 'archived') as 'active' | 'archived',
        createdAt: training.createdAt.toISOString(),
        raw: training,
        topic: training.topic,
        mandatory: training.mandatory,
        location: training.location,
        format: training.format,
        link: training.link,
        poc: {
          firstName: training.pocFirstName,
          lastName: training.pocLastName,
          email: training.pocEmail,
          phone: training.pocPhone,
          rankOrTitle: training.pocRankOrTitle,
        },
        ingestStatus: training.ingestStatus,
      })),
      ...events.map((event) => ({
        id: event.id,
        type: 'event' as const,
        category: 'Events',
        title: event.title ?? 'Untitled Event',
        summary: event.description ?? '',
        startDate: event.eventDate ? event.eventDate.toISOString() : null,
        endDate: event.eventDate ? event.eventDate.toISOString() : null,
        status: 'active' as const,
        createdAt: event.createdAt.toISOString(),
        raw: event,
      })),
      ...campaigns.map((campaign) => ({
        id: campaign.id,
        type: 'campaign' as const,
        category: 'Campaigns',
        title: campaign.title ?? 'Untitled Campaign',
        summary: campaign.description ?? '',
        startDate: campaign.windowStart ? campaign.windowStart.toISOString() : null,
        endDate: campaign.windowEnd ? campaign.windowEnd.toISOString() : null,
        status: 'active' as const,
        createdAt: campaign.createdAt.toISOString(),
        raw: campaign,
      })),
      ...impactEvents.map((impact) => ({
        id: impact.id,
        type: 'impact_event' as const,
        category: 'Impact Events',
        title: impact.title ?? 'Untitled Impact Event',
        summary: impact.description ?? '',
        startDate: impact.effectiveDate ? impact.effectiveDate.toISOString() : null,
        endDate: null,
        status: 'active' as const,
        createdAt: impact.createdAt.toISOString(),
        raw: impact,
      })),
      ...community.map((comm) => ({
        id: comm.id,
        type: 'community' as const,
        category: 'Community',
        title: comm.title ?? 'Untitled Community Event',
        summary: comm.description ?? '',
        startDate: comm.date ? comm.date.toISOString() : null,
        endDate: null,
        status: 'active' as const,
        createdAt: comm.createdAt.toISOString(),
        raw: comm,
      })),
      ...benefits.map((benefit) => ({
        id: benefit.id,
        type: 'benefits' as const,
        category: 'Benefits',
        title: benefit.title ?? 'Untitled Benefit',
        summary: benefit.description ?? '',
        startDate: benefit.windowStart ? benefit.windowStart.toISOString() : null,
        endDate: benefit.windowEnd ? benefit.windowEnd.toISOString() : null,
        status: 'active' as const,
        createdAt: benefit.createdAt.toISOString(),
        raw: benefit,
      })),
      ...careers.map((career) => ({
        id: career.id,
        type: 'career' as const,
        category: 'Career',
        title: career.title ?? 'Untitled Career Opportunity',
        summary: career.description ?? '',
        startDate: null,
        endDate: null,
        status: 'active' as const,
        createdAt: career.createdAt.toISOString(),
        raw: career,
      })),
      ...employeeCauses.map((cause) => ({
        id: cause.id,
        type: 'employee_cause' as const,
        category: 'Employee Cause',
        title: cause.title ?? 'Untitled Employee Cause',
        summary: cause.description ?? '',
        startDate: cause.windowStart ? cause.windowStart.toISOString() : null,
        endDate: cause.windowEnd ? cause.windowEnd.toISOString() : null,
        status: 'active' as const,
        createdAt: cause.createdAt.toISOString(),
        raw: cause,
      })),
    ]

    return NextResponse.json({
      success: true,
      items: normalizedItems,
    })
  } catch (error: any) {
    console.error('[WorkStuff API GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch WorkStuff items' },
      { status: 500 }
    )
  }
}
