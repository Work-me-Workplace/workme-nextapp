/**
 * API Route: Fetch all Workforce Stuff items
 *
 * Fetches all CompanyX models (Events, Training, Campaigns, etc.)
 * and returns them in a unified format for the dashboard
 *
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: companyId from query param (when allowed) or authenticated user's WorkMe
 *
 * When the client passes ?companyId=..., we use it only if the user's WorkMe
 * has no companyId (e.g. invite link) or the same companyId (so list URL hydrates).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const workMeCompanyId = workMe.companyId ?? null

    const { searchParams } = new URL(request.url)
    const queryCompanyId = searchParams.get('companyId')?.trim() || null

    const companyId =
      queryCompanyId &&
      (workMeCompanyId === null || workMeCompanyId === queryCompanyId)
        ? queryCompanyId
        : workMeCompanyId

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    console.log('[API GET /api/workforcestuff] Using companyId:', companyId, queryCompanyId ? '(from query)' : '(from WorkMe)')

    // Fetch all CompanyX models scoped by companyId
    const [trainings, events, campaigns, impactEvents, community, benefits, careers] = await Promise.all([
      // CompanyTraining
      prisma.companyTraining.findMany({
        where: { companyId },
        orderBy: { trainingDate: 'asc' },
      }),
      // CompanyEvent
      prisma.companyEvent.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCampaign
      prisma.companyCampaign.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyImpactEvent
      prisma.companyImpactEvent.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCommunity
      prisma.companyCommunity.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyBenefits
      prisma.companyBenefits.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCareer
      prisma.companyCareer.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Normalize all items into unified WorkforceStuffItem shape
    const normalizedItems = [
      // Normalize Trainings
      ...trainings.map((training) => ({
        id: training.id,
        type: 'training' as const,
        category: 'Training',
        title: training.title ?? 'Untitled Training',
        summary: training.description ?? '',
        startDate: training.trainingDate ? training.trainingDate.toISOString() : null,
        endDate: training.trainingDate ? training.trainingDate.toISOString() : null,
        status: training.status === 'ARCHIVED' ? 'archived' : (training.ingestStatus === 'saved' ? 'active' : (training.ingestStatus === 'pending' ? 'active' : 'archived')) as 'active' | 'archived',
        archived: training.status === 'ARCHIVED',
        createdAt: training.createdAt.toISOString(),
        raw: training,
        // Training-specific fields
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
      // Normalize Events
      ...events.map((event) => ({
        id: event.id,
        type: 'event' as const,
        category: 'Events',
        title: event.title ?? 'Untitled Event',
        summary: event.description ?? '',
        startDate: event.eventDate ? event.eventDate.toISOString() : null,
        endDate: event.eventDate ? event.eventDate.toISOString() : null,
        status: event.status === 'ARCHIVED' ? 'archived' : 'active' as const,
        archived: event.status === 'ARCHIVED',
        createdAt: event.createdAt.toISOString(),
        raw: event,
      })),
      // Normalize Campaigns
      ...campaigns.map((campaign) => ({
        id: campaign.id,
        type: 'campaign' as const,
        category: 'Campaigns',
        title: campaign.title ?? 'Untitled Campaign',
        summary: campaign.description ?? '',
        startDate: campaign.windowStart ? campaign.windowStart.toISOString() : null,
        endDate: campaign.windowEnd ? campaign.windowEnd.toISOString() : null,
        status: campaign.status === 'ARCHIVED' ? 'archived' : 'active' as const,
        archived: campaign.status === 'ARCHIVED',
        createdAt: campaign.createdAt.toISOString(),
        raw: campaign,
      })),
      // Normalize Impact Events
      ...impactEvents.map((impact) => ({
        id: impact.id,
        type: 'impact' as const,
        category: 'Impact Events',
        title: impact.title ?? 'Untitled Impact Event',
        summary: impact.description ?? '',
        startDate: impact.effectiveDate ? impact.effectiveDate.toISOString() : null,
        endDate: null,
        status: impact.status === 'ARCHIVED' ? 'archived' : 'active' as const,
        archived: impact.status === 'ARCHIVED',
        createdAt: impact.createdAt.toISOString(),
        raw: impact,
      })),
      // Normalize Community
      ...community.map((comm) => ({
        id: comm.id,
        type: 'community' as const,
        category: 'Community',
        title: comm.title ?? 'Untitled Community Event',
        summary: comm.description ?? '',
        startDate: comm.date ? comm.date.toISOString() : null,
        endDate: null,
        status: comm.status === 'ARCHIVED' ? 'archived' : 'active' as const,
        archived: comm.status === 'ARCHIVED',
        createdAt: comm.createdAt.toISOString(),
        raw: comm,
      })),
      // Normalize Benefits
      ...benefits.map((benefit) => ({
        id: benefit.id,
        type: 'benefit' as const,
        category: 'Benefits',
        title: benefit.title ?? 'Untitled Benefit',
        summary: benefit.description ?? '',
        startDate: benefit.windowStart ? benefit.windowStart.toISOString() : null,
        endDate: benefit.windowEnd ? benefit.windowEnd.toISOString() : null,
        status: benefit.status === 'ARCHIVED' ? 'archived' : 'active' as const,
        archived: benefit.status === 'ARCHIVED',
        createdAt: benefit.createdAt.toISOString(),
        raw: benefit,
      })),
      // Normalize Careers
      ...careers.map((career) => ({
        id: career.id,
        type: 'career' as const,
        category: 'Career',
        title: career.title ?? 'Untitled Career Opportunity',
        summary: career.description ?? '',
        startDate: null, // Careers use deadlines JSON, not a single date
        endDate: null,
        status: career.status === 'ARCHIVED' ? 'archived' : 'active' as const,
        archived: career.status === 'ARCHIVED',
        createdAt: career.createdAt.toISOString(),
        raw: career,
      })),
    ]

    // Add archived field to all items if missing (backward compatibility)
    const normalizedItemsWithArchived = normalizedItems.map(item => ({
      ...item,
      archived: item.archived !== undefined ? item.archived : false,
    }))

    return NextResponse.json({
      success: true,
      items: normalizedItemsWithArchived,
    })
  } catch (error: any) {
    console.error('[WorkforceStuff API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workforce stuff' },
      { status: 500 }
    )
  }
}

