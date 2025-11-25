import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/events/hydrate
 * 
 * Hydrates all events for a company.
 * Returns events, event routers, and stats.
 * 
 * Query params:
 * - companyId: Company ID to hydrate events for
 */
export async function GET(request: NextRequest) {
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    const searchParams = request.nextUrl.searchParams
    const requestedCompanyId = searchParams.get('companyId')

    // Use provided companyId or authenticated user's companyId
    const targetCompanyId = requestedCompanyId || companyId

    if (!targetCompanyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required' },
        { status: 400 },
      )
    }

    // Verify user has access to this company
    // (In a multi-tenant system, you'd check if workMeId belongs to companyId)
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: { companyId: true },
    })

    if (!workMe || workMe.companyId !== targetCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Access denied to this company' },
        { status: 403 },
      )
    }

    // Fetch all event routers for this company
    const eventRouters = await prisma.workEventRouter.findMany({
      where: {
        companyId: targetCompanyId,
        type: 'event',
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch all events referenced by routers
    const eventRefIds = eventRouters
      .map((router) => router.eventRefId)
      .filter((id): id is string => !!id)

    const events = eventRefIds.length > 0
      ? await prisma.workEvent.findMany({
          where: {
            id: { in: eventRefIds },
            companyId: targetCompanyId, // Ensure same company for security
          },
          include: {
            eventItems: true,
          },
        })
      : []

    // Calculate stats
    const now = new Date()
    const upcomingCount = events.filter(
      (event) => event.eventDate && new Date(event.eventDate) > now,
    ).length
    const pastCount = events.filter(
      (event) => event.eventDate && new Date(event.eventDate) <= now,
    ).length

    const stats = {
      eventCount: events.length,
      upcomingCount,
      pastCount,
    }

    // Map routers to events for enriched response
    const enrichedRouters = eventRouters.map((router) => {
      const event = events.find((e) => e.id === router.eventRefId)
      return {
        id: router.id,
        type: router.type,
        title: event?.title || '',
        eventRefId: router.eventRefId,
        companyId: router.companyId,
        originatorId: router.originatorId,
        createdAt: router.createdAt,
      }
    })

    // Format response
    const response = {
      success: true,
      events,
      eventRouters: enrichedRouters,
      stats,
    }

    console.log('[API GET /api/events/hydrate] SUCCESS', {
      companyId: targetCompanyId,
      eventCount: events.length,
      routerCount: eventRouters.length,
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[API GET /api/events/hydrate] ERROR:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to hydrate events',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
