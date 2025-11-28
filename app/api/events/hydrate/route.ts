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

    // Fetch all CompanyEvent models for this company directly
    const events = await prisma.companyEvent.findMany({
      where: {
        companyId: targetCompanyId, // Multi-tenant security
      },
      orderBy: { createdAt: 'desc' },
      include: {
        eventItems: true,
      },
    })

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

    // Format response (events are already CompanyEvent models)
    const response = {
      success: true,
      events: events.map(event => ({
        ...event,
        type: 'event' as const,
      })),
      stats,
    }

    console.log('[API GET /api/events/hydrate] SUCCESS', {
      companyId: targetCompanyId,
      eventCount: events.length,
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
