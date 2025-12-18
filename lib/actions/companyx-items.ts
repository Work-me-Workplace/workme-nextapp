'use server'

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

/**
 * Fetch CompanyX items by date range
 * This is the KEY to hydrating items for digest creation
 */
export async function getCompanyXItemsByDateRange(
  startDate: Date,
  endDate: Date
) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return { success: false, error: 'User must set a companyId' }
    }

    // Query all CompanyX types within date range
    const [events, campaigns, trainings, benefits, impactEvents, communities, careers, employeeCauses] = await Promise.all([
      // Events (by eventDate)
      prisma.companyEvent.findMany({
        where: {
          companyId,
          eventDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          title: true,
          theme: true,
          description: true,
          eventDate: true,
          startTime: true,
          endTime: true,
          registrationRequired: true,
          registrationLink: true,
          pocEmail: true,
          pocPhone: true,
          createdAt: true,
        },
        orderBy: { eventDate: 'asc' },
      }),

      // Campaigns (by window)
      prisma.companyCampaign.findMany({
        where: {
          companyId,
          OR: [
            {
              windowStart: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              windowEnd: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          summary: true,
          windowStart: true,
          windowEnd: true,
          pocFirstName: true,
          pocLastName: true,
          pocEmail: true,
          createdAt: true,
        },
        orderBy: { windowStart: 'asc' },
      }),

      // Trainings (by trainingDate)
      prisma.companyTraining.findMany({
        where: {
          companyId,
          trainingDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          title: true,
          topic: true,
          description: true,
          mandatory: true,
          trainingDate: true,
          startTime: true,
          endTime: true,
          location: true,
          format: true,
          link: true,
          pocFirstName: true,
          pocLastName: true,
          pocEmail: true,
          pocPhone: true,
          createdAt: true,
        },
        orderBy: { trainingDate: 'asc' },
      }),

      // Benefits (by window)
      prisma.companyBenefits.findMany({
        where: {
          companyId,
          OR: [
            {
              windowStart: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              windowEnd: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          windowStart: true,
          windowEnd: true,
          createdAt: true,
        },
        orderBy: { windowStart: 'asc' },
      }),

      // Impact Events (by effectiveDate)
      prisma.companyImpactEvent.findMany({
        where: {
          companyId,
          effectiveDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          summary: true,
          effectiveDate: true,
          impactedPopulation: true,
          urgency: true,
          pocFirstName: true,
          pocLastName: true,
          pocEmail: true,
          createdAt: true,
        },
        orderBy: { effectiveDate: 'asc' },
      }),

      // Communities (by date)
      prisma.companyCommunity.findMany({
        where: {
          companyId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          pocFirstName: true,
          pocLastName: true,
          pocEmail: true,
          createdAt: true,
        },
        orderBy: { date: 'asc' },
      }),

      // Careers (no date filter, use createdAt)
      prisma.companyCareer.findMany({
        where: {
          companyId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Employee Causes (by window)
      prisma.companyEmployeeCause.findMany({
        where: {
          companyId,
          OR: [
            {
              windowStart: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              windowEnd: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          windowStart: true,
          windowEnd: true,
          createdAt: true,
        },
        orderBy: { windowStart: 'asc' },
      }),
    ])

    return {
      success: true,
      items: {
        events,
        campaigns,
        trainings,
        benefits,
        impactEvents,
        communities,
        careers,
        employeeCauses,
      },
      counts: {
        events: events.length,
        campaigns: campaigns.length,
        trainings: trainings.length,
        benefits: benefits.length,
        impactEvents: impactEvents.length,
        communities: communities.length,
        careers: careers.length,
        employeeCauses: employeeCauses.length,
        total: events.length + campaigns.length + trainings.length + benefits.length + impactEvents.length + communities.length + careers.length + employeeCauses.length,
      },
    }
  } catch (error) {
    console.error('Error fetching CompanyX items:', error)
    return { success: false, error: 'Failed to fetch CompanyX items' }
  }
}

/**
 * Get items by specific type
 */
export async function getCompanyXItemsByType(
  type: 'CompanyEvent' | 'CompanyCampaign' | 'CompanyTraining' | 'CompanyBenefits' | 'CompanyImpactEvent' | 'CompanyCommunity' | 'CompanyCareer' | 'CompanyEmployeeCause'
) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return { success: false, error: 'User must set a companyId' }
    }

    let items: any[] = []

    switch (type) {
      case 'CompanyEvent':
        items = await prisma.companyEvent.findMany({
          where: { companyId },
          orderBy: { eventDate: 'desc' },
          take: 50,
        })
        break
      case 'CompanyCampaign':
        items = await prisma.companyCampaign.findMany({
          where: { companyId },
          orderBy: { windowStart: 'desc' },
          take: 50,
        })
        break
      case 'CompanyTraining':
        items = await prisma.companyTraining.findMany({
          where: { companyId },
          orderBy: { trainingDate: 'desc' },
          take: 50,
        })
        break
      case 'CompanyBenefits':
        items = await prisma.companyBenefits.findMany({
          where: { companyId },
          orderBy: { windowStart: 'desc' },
          take: 50,
        })
        break
      case 'CompanyImpactEvent':
        items = await prisma.companyImpactEvent.findMany({
          where: { companyId },
          orderBy: { effectiveDate: 'desc' },
          take: 50,
        })
        break
      case 'CompanyCommunity':
        items = await prisma.companyCommunity.findMany({
          where: { companyId },
          orderBy: { date: 'desc' },
          take: 50,
        })
        break
      case 'CompanyCareer':
        items = await prisma.companyCareer.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        break
      case 'CompanyEmployeeCause':
        items = await prisma.companyEmployeeCause.findMany({
          where: { companyId },
          orderBy: { windowStart: 'desc' },
          take: 50,
        })
        break
    }

    return { success: true, items }
  } catch (error) {
    console.error('Error fetching items by type:', error)
    return { success: false, error: 'Failed to fetch items' }
  }
}
