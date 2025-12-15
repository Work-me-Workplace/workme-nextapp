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
 * - CompanyCampaign[] (scoped by companyUnit string)
 * - CompanyTraining[] (scoped by companyUnit string)
 * - CompanyEvent[] (scoped by companyUnit string)
 * - etc.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/dashboard/hydrate] Starting...')
    
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    console.log('[API GET /api/dashboard/hydrate] Auth verified, firebaseId:', firebaseId)
    
    // 2. Get WorkMe to get companyId and companyUnit
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        companyId: true,
        companyUnit: true,
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

    const { companyId, companyUnit } = workMe
    console.log('[API GET /api/dashboard/hydrate] WorkMe found:', {
      id: workMe.id,
      companyId,
      companyUnit,
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

      // CompanyCampaign - scoped by companyUnit string
      companyUnit
        ? prisma.companyCampaign.findMany({
            where: { companyUnit },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyTraining - scoped by companyUnit string
      companyUnit
        ? prisma.companyTraining.findMany({
            where: { companyUnit },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyEvent - scoped by companyUnit string
      companyUnit
        ? prisma.companyEvent.findMany({
            where: { companyUnit },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyCommunity - scoped by companyUnit string
      companyUnit
        ? prisma.companyCommunity.findMany({
            where: { companyUnit },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyCareer - scoped by companyUnit string
      companyUnit
        ? prisma.companyCareer.findMany({
            where: { companyUnit },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyBenefits - scoped by companyUnit string
      companyUnit
        ? prisma.companyBenefits.findMany({
            where: { companyUnit },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // CompanyEmployeeCause - scoped by companyUnit string
      companyUnit
        ? prisma.companyEmployeeCause.findMany({
            where: { companyUnit },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
        : [],

      // Work Products - scoped by companyUnit and createdByWorkMeId
      companyUnit && workMe.id
        ? Promise.all([
            // Email Digest Products
            prisma.workForceEnduringProdEmailDigest.findMany({
              where: {
                companyUnit,
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
                companyUnit,
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
          ]).then(([emailDigests, digitalSignage]) => [
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
              let headline = `Digital Signage - ${p.signType}`
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
                headline = p.companyEvent.eventName
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
        companyUnit,
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

