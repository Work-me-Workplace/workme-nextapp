/**
 * API Route: Fetch all Workforce Stuff items
 *
 * Fetches all CompanyX models (Events, Training, Campaigns, etc.)
 * and returns them in a unified format for the dashboard.
 *
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: companyId from authenticated user's WorkMe only (single-tenant).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Derive "past" from dates only. No stored status — UX/API use date checker. */
function isPast(startDate: string | null, endDate: string | null): boolean {
  const now = new Date()
  if (endDate) return new Date(endDate) < now
  if (startDate) return new Date(startDate) < now
  return false
}

export async function GET(request: NextRequest) {
  try {
    // Auth: Just verify Firebase token
    await verifyAuth(request)
    
    const url = new URL(request.url)
    
    // Get companyId from query params (from localStorage) - no helpers, just localStorage
    const companyId = url.searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 }
      )
    }

    // Get workMeId from query params too (for owner access)
    const workMeId = url.searchParams.get('workMeId')
    
    // Fetch all CompanyX models scoped by companyId OR workMeId (owner access)
    // CompanyEvent: include legacy records where companyId is null but workMe.companyId matches
    const [trainings, events, campaigns, impactEvents, community, benefits, careers, employeeCauses, leaderEngagements] = await Promise.all([
      // CompanyTraining - query by companyId OR workMeId (owner)
      prisma.companyTraining.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { trainingDate: 'asc' },
      }),
      // CompanyEvent - query by companyId OR workMeId (owner)
      prisma.companyEvent.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCampaign - query by companyId OR workMeId (owner)
      prisma.companyCampaign.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyImpactEvent - query by companyId OR workMeId (owner)
      prisma.companyImpactEvent.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCommunity - query by companyId OR workMeId (owner)
      prisma.companyCommunity.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyBenefits - query by companyId OR workMeId (owner)
      prisma.companyBenefits.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyCareer - query by companyId OR workMeId (owner)
      prisma.companyCareer.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyEmployeeCause - query by companyId OR workMeId (owner)
      prisma.companyEmployeeCause.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyLeaderEngagement - query by companyId OR workMeId (owner)
      prisma.companyLeaderEngagement.findMany({
        where: {
          OR: [
            { companyId },
            ...(workMeId ? [{ workMeId }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Normalize all items into unified WorkforceStuffItem shape
    const normalizedItems = [
      // Normalize Trainings (date-derived: use completionDeadline as end when self-paced)
      ...trainings.map((training) => {
        const startDate = training.trainingDate ? training.trainingDate.toISOString() : null
        const endDate = training.isSelfPaced && training.completionDeadline
          ? training.completionDeadline.toISOString()
          : (training.trainingDate ? training.trainingDate.toISOString() : null)
        const past = isPast(startDate, endDate)
        return {
        id: training.id,
        type: 'training' as const,
        category: 'Training',
        title: training.title ?? 'Untitled Training',
        summary: training.description ?? '',
        startDate,
        endDate,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
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
      }
      }),
      // Normalize Events
      ...events.map((event) => {
        const startDate = event.eventDate ? event.eventDate.toISOString() : null
        const endDate = startDate
        const past = isPast(startDate, endDate)
        return {
        id: event.id,
        type: 'event' as const,
        category: 'Events',
        title: event.title ?? 'Untitled Event',
        summary: event.description ?? '',
        startDate,
        endDate,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: event.createdAt.toISOString(),
        raw: event,
      }
      }),
      // Normalize Campaigns
      ...campaigns.map((campaign) => {
        const startDate = campaign.windowStart ? campaign.windowStart.toISOString() : null
        const endDate = campaign.windowEnd ? campaign.windowEnd.toISOString() : null
        const past = isPast(startDate, endDate)
        return {
        id: campaign.id,
        type: 'campaign' as const,
        category: 'Campaigns',
        title: campaign.title ?? 'Untitled Campaign',
        summary: campaign.description ?? '',
        startDate,
        endDate,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: campaign.createdAt.toISOString(),
        raw: campaign,
      }
      }),
      // Normalize Impact Events
      ...impactEvents.map((impact) => {
        const startDate = impact.effectiveDate ? impact.effectiveDate.toISOString() : null
        const past = isPast(startDate, null)
        return {
        id: impact.id,
        type: 'impact' as const,
        category: 'Impact Events',
        title: impact.title ?? 'Untitled Impact Event',
        summary: impact.description ?? '',
        startDate,
        endDate: null,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: impact.createdAt.toISOString(),
        raw: impact,
      }
      }),
      // Normalize Community
      ...community.map((comm) => {
        const startDate = comm.date ? comm.date.toISOString() : null
        const past = isPast(startDate, null)
        return {
        id: comm.id,
        type: 'community' as const,
        category: 'Community',
        title: comm.title ?? 'Untitled Community Event',
        summary: comm.description ?? '',
        startDate,
        endDate: null,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: comm.createdAt.toISOString(),
        raw: comm,
      }
      }),
      // Normalize Benefits
      ...benefits.map((benefit) => {
        const startDate = benefit.windowStart ? benefit.windowStart.toISOString() : null
        const endDate = benefit.windowEnd ? benefit.windowEnd.toISOString() : null
        const past = isPast(startDate, endDate)
        return {
        id: benefit.id,
        type: 'benefit' as const,
        category: 'Benefits',
        title: benefit.title ?? 'Untitled Benefit',
        summary: benefit.description ?? '',
        startDate,
        endDate,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: benefit.createdAt.toISOString(),
        raw: benefit,
      }
      }),
      // Normalize Careers (windowStart/windowEnd optional; no dates = current)
      ...careers.map((career) => {
        const startDate = career.windowStart ? career.windowStart.toISOString() : null
        const endDate = career.windowEnd ? career.windowEnd.toISOString() : null
        const past = isPast(startDate, endDate)
        return {
        id: career.id,
        type: 'career' as const,
        category: 'Career',
        title: career.title ?? 'Untitled Career Opportunity',
        summary: career.description ?? '',
        startDate,
        endDate,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: career.createdAt.toISOString(),
        raw: career,
      }
      }),
      // Normalize Employee Causes
      ...employeeCauses.map((cause) => {
        const startDate = cause.windowStart ? cause.windowStart.toISOString() : null
        const endDate = cause.windowEnd ? cause.windowEnd.toISOString() : null
        const past = isPast(startDate, endDate)
        return {
        id: cause.id,
        type: 'cause' as const,
        category: 'Employee Cause',
        title: cause.title ?? 'Untitled Employee Cause',
        summary: cause.description ?? '',
        startDate,
        endDate,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: cause.createdAt.toISOString(),
        raw: cause,
      }
      }),
      // Normalize Leader Engagements
      ...leaderEngagements.map((engagement) => {
        const startDate = engagement.engagementDate ? engagement.engagementDate.toISOString() : null
        const past = isPast(startDate, null)
        return {
        id: engagement.id,
        type: 'leader_engagement' as const,
        category: 'Leader Engagement',
        title: engagement.title ?? 'Untitled Leader Engagement',
        summary: engagement.description ?? '',
        startDate,
        endDate: null,
        status: (past ? 'archived' : 'active') as 'active' | 'archived',
        archived: past,
        createdAt: engagement.createdAt.toISOString(),
        raw: engagement,
      }
      }),
    ]

    // Add archived field to all items if missing (backward compatibility)
    const normalizedItemsWithArchived = normalizedItems.map(item => ({
      ...item,
      archived: item.archived !== undefined ? item.archived : false,
    }))

    return NextResponse.json({
      success: true,
      companyId,
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

