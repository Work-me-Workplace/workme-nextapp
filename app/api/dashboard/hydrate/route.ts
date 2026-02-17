import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/hydrate
 * 
 * Phase 2 Hydration: Loads all models that depend on WorkMe identity.
 * Called on dashboard page after WorkMe is already hydrated.
 * 
 * Returns:
 * - CompanyEmployee[] (scoped by companyId)
 * - CompanyEmployeeHighlight[] (scoped by companyId)
 * - CompanyCampaign[] (scoped by companyId)
 * - CompanyTraining[] (scoped by companyId)
 * - CompanyEvent[] (scoped by companyId)
 * - etc.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/dashboard/hydrate] Starting...')
    
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    console.log('[API GET /api/dashboard/hydrate] Auth verified, firebaseId:', firebaseId)
    
    // 2. Get WorkMe to get companyId (companyUnit is deprecated)
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        companyId: true,
      },
    })

    if (!workMe) {
      console.error('[API GET /api/dashboard/hydrate] WorkMe not found for firebaseId:', firebaseId)
      return NextResponse.json(
        {
          success: false,
          error: 'WorkMe not found',
        },
        { status: 404 },
      )
    }

    const { companyId } = workMe
    console.log('[API GET /api/dashboard/hydrate] WorkMe found:', {
      id: workMe.id,
      companyId,
    })

    // 3. Hydrate all models scoped by companyId or companyUnit
    const [
      employees,
      highlights,
      campaigns,
      trainings,
      events,
      communities,
      careers,
      benefits,
      employeeCauses,
      products,
    ] = await Promise.all([
      // CompanyEmployee - scoped by companyId
      companyId
        ? prisma.companyEmployee.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit for performance
          })
        : [],

      // CompanyEmployeeHighlight - scoped by companyId via employee relation
      companyId
        ? prisma.companyEmployeeHighlight.findMany({
            where: {
              employee: {
                companyId,
              },
            },
            include: {
              employee: {
                select: {
                  id: true,
                  fullName: true,
                  title: true,
                  photoUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyCampaign - scoped by companyId (companyUnit deprecated)
      companyId
        ? prisma.companyCampaign.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyTraining - scoped by companyId (companyUnit deprecated)
      companyId
        ? prisma.companyTraining.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyEvent - scoped by companyId (companyUnit deprecated)
      companyId
        ? prisma.companyEvent.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyCommunity - scoped by companyId (companyUnit deprecated)
      companyId
        ? prisma.companyCommunity.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyCareer - scoped by companyId (companyUnit deprecated)
      companyId
        ? prisma.companyCareer.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyBenefits - scoped by companyId (companyUnit deprecated)
      companyId
        ? prisma.companyBenefits.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyEmployeeCause - scoped by companyId (companyUnit deprecated)
      companyId
        ? prisma.companyEmployeeCause.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // Work Products - scoped by createdByWorkMeId only (companyUnit deprecated)
      workMe.id
        ? Promise.all([
            // Email Digest Products
            prisma.workForceEnduringProdEmailDigest.findMany({
              where: {
                createdByWorkMeId: workMe.id,
              },
              include: {
                _count: {
                  select: {
                    editions: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            }),
            // Digital Signage Products - hydrate with full nested data
            prisma.productDigitalSign.findMany({
              where: {
                createdByWorkMeId: workMe.id,
                archivedAt: null, // Only active items
              },
              include: {
                workforceAchievement: {
                  include: {
                    imageAsset: {
                      select: {
                        id: true,
                        url: true,
                        filename: true,
                      },
                    },
                  },
                },
                workforce: true,
                companyNews: true,
                companyEvent: true,
              },
              orderBy: { createdAt: 'desc' },
            }),
            // Comms Plan Products
            prisma.productCommsPlan.findMany({
              where: {
                createdByWorkMeId: workMe.id,
                archivedAt: null, // Only active items
              },
              orderBy: { createdAt: 'desc' },
            }),
          ]).then(([emailDigests, digitalSignage, commsPlans]) => [
            ...emailDigests.map(p => ({
              id: p.id,
              type: 'email_digest',
              title: p.title,
              description: p.description,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.createdAt.toISOString(),
              metadata: {
                editionsCount: p._count.editions,
              },
            })),
            ...digitalSignage.map(p => {
              // Extract preview data from nested relations
              let headline: string = `Digital Signage - ${p.signType}`
              let subhead: string | null = null
              let imageUrl: string | null = null

              if (p.workforceAchievement) {
                headline = p.workforceAchievement.headline
                subhead = p.workforceAchievement.subhead || null
                imageUrl = p.workforceAchievement.imageAsset?.url || null
              } else if (p.workforce) {
                headline = p.workforce.title
                subhead = p.workforce.summary || null
              } else if (p.companyNews) {
                headline = p.companyNews.headline
                subhead = p.companyNews.subheadline || null
              } else if (p.companyEvent) {
                headline = p.companyEvent.eventName ? p.companyEvent.eventName : 'Untitled Event'
                subhead = p.companyEvent.description || null
              }

              return {
                id: p.id,
                type: 'digital_signage',
                title: headline,
                description: subhead,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                metadata: {
                  signType: p.signType,
                  headline,
                  subhead,
                  imageUrl,
                  // Include full nested data for detail views
                  workforceAchievement: p.workforceAchievement,
                  workforce: p.workforce,
                  companyNews: p.companyNews,
                  companyEvent: p.companyEvent,
                },
              }
            }),
            ...commsPlans.map(p => ({
              id: p.id,
              type: 'comms_plan',
              title: p.parsedTitle || 'Comms Plan',
              description: null,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
              metadata: {
                hasFullText: !!p.fullText,
                objectivesCount: Array.isArray(p.parsedObjectives) ? p.parsedObjectives.length : 0,
              },
            })),
          ])
        : [],
    ])

    console.log('[API GET /api/dashboard/hydrate] Success, returning dashboard data:', {
      employees: employees.length,
      highlights: highlights.length,
      campaigns: campaigns.length,
      trainings: trainings.length,
      events: events.length,
      communities: communities.length,
      careers: careers.length,
      benefits: benefits.length,
      employeeCauses: employeeCauses.length,
      products: products.length,
    })

    return NextResponse.json({
      success: true,
      dashboard: {
        companyId,
        employees,
        highlights,
        campaigns,
        trainings,
        events,
        communities,
        careers,
        benefits,
        employeeCauses,
        products,
      },
    })
  } catch (error: any) {
    console.error('[API GET /api/dashboard/hydrate] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to hydrate dashboard',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

