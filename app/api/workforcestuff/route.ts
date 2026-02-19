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
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
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
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    // Fetch all CompanyX models scoped by companyId
    // CompanyEvent: include legacy records where companyId is null but workMe.companyId matches
    const [trainings, events, campaigns, impactEvents, community, benefits, careers, employeeCauses, leaderEngagements] = await Promise.all([
      // CompanyTraining
      prisma.companyTraining.findMany({
        where: { companyId },
        orderBy: { trainingDate: 'asc' },
      }),
      // CompanyEvent - fallback to workMe.companyId for legacy records with null companyId
      prisma.companyEvent.findMany({
        where: {
          OR: [
            { companyId },
            { workMe: { companyId } },
          ],
        },
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
      // CompanyEmployeeCause
      prisma.companyEmployeeCause.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      // CompanyLeaderEngagement
      prisma.companyLeaderEngagement.findMany({
        where: { companyId },
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
        status: (past ? 'archived' : 'active') as const,
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
        status: (past ? 'archived' : 'active') as const,
        archived: past,
        createdAt: campaign.createdAt.toISOString(),
        raw: campaign,
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
        status: (past ? 'archived' : 'active') as const,
        archived: past,
        createdAt: impact.createdAt.toISOString(),
        raw: impact,
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
        status: (past ? 'archived' : 'active') as const,
        archived: past,
        createdAt: comm.createdAt.toISOString(),
        raw: comm,
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
        status: (past ? 'archived' : 'active') as const,
        archived: past,
        createdAt: benefit.createdAt.toISOString(),
        raw: benefit,
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
        status: (past ? 'archived' : 'active') as const,
        archived: past,
        createdAt: career.createdAt.toISOString(),
        raw: career,
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
        status: (past ? 'archived' : 'active') as const,
        archived: past,
        createdAt: cause.createdAt.toISOString(),
        raw: cause,
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
        status: (past ? 'archived' : 'active') as const,
        archived: past,
        createdAt: engagement.createdAt.toISOString(),
        raw: engagement,
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

