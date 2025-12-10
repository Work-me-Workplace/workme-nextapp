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
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
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
      return NextResponse.json(
        {
          success: false,
          error: 'WorkMe not found',
        },
        { status: 404 },
      )
    }

    const { companyId, companyUnit } = workMe

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

      // CompanyEmployeeHighlight - scoped by companyId via employees
      companyId
        ? prisma.companyEmployeeHighlight.findMany({
            where: {
              employees: {
                some: {
                  employee: {
                    companyId,
                  },
                },
              },
            },
            include: {
              employees: {
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
            // Digital Signage Products
            prisma.productDigitalSign.findMany({
              where: {
                companyUnit,
                createdByWorkMeId: workMe.id,
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
            ...digitalSignage.map(p => ({
              id: p.id,
              type: 'digital_signage',
              title: `Digital Signage - ${p.signType}`,
              description: null,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
              metadata: {
                signType: p.signType,
              },
            })),
          ])
        : [],
    ])

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
      error: error.message,
      stack: error.stack,
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

