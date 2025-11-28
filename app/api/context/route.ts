import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'

// Force dynamic rendering (API routes are dynamic by default, but explicit for safety)
export const dynamic = 'force-dynamic'

/**
 * GET /api/context
 * List all WorkContexts for the authenticated user
 * Uses new factory pattern for enrichment
 */
export async function GET(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    console.log('[API GET /api/context]', {
      workMeId,
      companyId,
    })

    // Get all CompanyX models for user's company (multi-tenant scoping)
    const [campaigns, impactEvents, trainings, events, communities, benefits, careers, employeeCauses] = await Promise.all([
      prisma.companyCampaign.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyImpactEvent.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyTraining.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEvent.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCommunity.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyBenefits.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCareer.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEmployeeCause.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Combine all contexts with their types
    const allContexts = [
      ...campaigns.map(c => ({ ...c, type: 'campaign' as const })),
      ...impactEvents.map(e => ({ ...e, type: 'impact_event' as const })),
      ...trainings.map(t => ({ ...t, type: 'training' as const })),
      ...events.map(e => ({ ...e, type: 'event' as const })),
      ...communities.map(c => ({ ...c, type: 'community' as const })),
      ...benefits.map(b => ({ ...b, type: 'benefits' as const })),
      ...careers.map(c => ({ ...c, type: 'career' as const })),
      ...employeeCauses.map(e => ({ ...e, type: 'employee_cause' as const })),
    ]

    // Sort by createdAt descending
    allContexts.sort((a, b) => {
      const aDate = a.createdAt?.getTime() || 0
      const bDate = b.createdAt?.getTime() || 0
      return bDate - aDate
    })

    // Enrich with typed data (already have it, just format)
    const enrichedContexts = allContexts.map(ctx => ({
      ...ctx,
      typedData: ctx,
      title: ctx.title || 'Unknown',
    }))

    console.log('[API GET /api/context] SUCCESS', {
      workMeId,
      companyId,
      count: enrichedContexts.length,
      contexts: enrichedContexts.map(c => ({
        id: c.id,
        type: c.type,
        title: c.title,
      })),
    })

    return NextResponse.json({
      success: true,
      workContexts: enrichedContexts,
    })
  } catch (error: any) {
    console.error('❌ GET /api/context error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch contexts',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

