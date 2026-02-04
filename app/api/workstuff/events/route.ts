/**
 * WorkStuff Events API
 * 
 * GET /api/workstuff/events - List all events
 * POST /api/workstuff/events - Create new event
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { createCompanyXWithIngest } from '@/lib/services/companyx-mapper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity to get companyId (source of truth - secure, verified)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    const events = await prisma.companyEvent.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
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
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity to get companyId (source of truth - secure, verified)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { data, rawText } = body
    
    // Use authenticated user's companyId (ignore any companyId in body for security)

    // If rawText provided, use ingest flow
    if (rawText) {
      const result = await createCompanyXWithIngest(
        prisma,
        'event',
        rawText,
        workMeId,
        companyId
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
        companyId,
        workMeId: workMeId,
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
