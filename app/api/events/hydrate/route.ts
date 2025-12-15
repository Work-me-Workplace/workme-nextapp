import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

export const dynamic = 'force-dynamic'

/**
 * GET /api/events/hydrate
 * 
 * Hydrates all events for a company unit.
 * Returns events, event routers, and stats.
 * 
 * Query params:
 * - companyUnit: Company unit to hydrate events for
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe
    const searchParams = request.nextUrl.searchParams
    const requestedCompanyUnit = searchParams.get('companyUnit')

    // Use provided companyUnit or authenticated user's companyUnit
    const targetCompanyUnit = requestedCompanyUnit || companyUnit

    if (!targetCompanyUnit) {
      return NextResponse.json(
        { success: false, error: 'companyUnit is required' },
        { status: 400 },
      )
    }

    // Verify user has access to this company unit
    if (!companyUnit || companyUnit !== targetCompanyUnit) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Access denied to this company unit' },
        { status: 403 },
      )
    }

    // Fetch all CompanyEvent models for this company directly
    const events = await prisma.companyEvent.findMany({
      where: {
        companyId: targetCompanyUnit, // Multi-tenant security (using companyId)
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
      companyUnit: targetCompanyUnit,
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
