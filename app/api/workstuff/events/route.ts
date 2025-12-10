/**
 * WorkStuff Events API
 * 
 * GET /api/workstuff/events - List all events
 * POST /api/workstuff/events - Create new event
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { createCompanyXWithIngest } from '@/lib/services/companyx-mapper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireWorkMeAuth(request)

    const { searchParams } = new URL(request.url)
    const companyUnitId = searchParams.get('companyUnitId')

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId query parameter is required' },
        { status: 400 }
      )
    }

    const events = await prisma.companyEvent.findMany({
      where: { companyUnit: companyUnitId },
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

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        ...event,
        type: 'event' as const,
      })),
      stats,
    })
  } catch (error: any) {
    console.error('[WorkStuff Events GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { companyUnitId, data, rawText } = body

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 }
      )
    }

    // If rawText provided, use ingest flow
    if (rawText) {
      const result = await createCompanyXWithIngest(
        prisma,
        'event',
        rawText,
        workMeId,
        companyUnitId
      )

      return NextResponse.json({
        success: true,
        id: result.id,
        event: result.record,
      })
    }

    // Otherwise create with provided data
    const event = await prisma.companyEvent.create({
      data: {
        ...data,
        companyUnit: companyUnitId,
        createdByWorkMeId: workMeId,
      },
    })

    return NextResponse.json({
      success: true,
      id: event.id,
      event,
    })
  } catch (error: any) {
    console.error('[WorkStuff Events POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}
