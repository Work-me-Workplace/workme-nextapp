/**
 * API Route: Fetch all Workforce Stuff items
 * 
 * Fetches all CompanyX models (Events, Training, Campaigns, etc.)
 * and returns them in a unified format for the dashboard
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
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyUnit not set' },
        { status: 401 }
      )
    }

    // Fetch all CompanyX models
    const [trainings, events, campaigns, impactEvents, community, benefits, careers] = await Promise.all([
      // CompanyTraining
      prisma.companyTraining.findMany({
        where: { companyUnit },
        orderBy: { trainingDate: 'asc' },
      }),
      // CompanyEvent
      prisma.companyEvent.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCampaign
      prisma.companyCampaign.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyImpactEvent
      prisma.companyImpactEvent.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCommunity
      prisma.companyCommunity.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyBenefits
      prisma.companyBenefits.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCareer
      prisma.companyCareer.findMany({
        where: { companyUnit },
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
        status: training.ingestStatus === 'saved' ? 'active' : (training.ingestStatus === 'pending' ? 'active' : 'archived') as 'active' | 'archived',
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
        status: 'active' as const,
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
        status: 'active' as const,
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
        status: 'active' as const,
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
        status: 'active' as const,
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
        status: 'active' as const,
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
        status: 'active' as const,
        createdAt: career.createdAt.toISOString(),
        raw: career,
      })),
    ]

    return NextResponse.json({
      success: true,
      items: normalizedItems,
    })
  } catch (error: any) {
    console.error('[WorkforceStuff API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workforce stuff' },
      { status: 500 }
    )
  }
}

