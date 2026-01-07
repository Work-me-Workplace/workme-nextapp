/**
 * WorkStuff Event API
 * 
 * GET /api/workstuff/events/[id] - Get single event
 * PUT /api/workstuff/events/[id] - Update event
 * DELETE /api/workstuff/events/[id] - Delete event
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireWorkMeAuth(request)

    const { id } = await params
    const event = await prisma.companyEvent.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error: any) {
    console.error('[WorkStuff Event GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireWorkMeAuth(request)

    const { id } = await params
    const body = await request.json()
    const { data, companyId } = body

    const existing = await prisma.companyEvent.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    if (companyId && existing.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: companyId mismatch' },
        { status: 403 }
      )
    }

    const updated = await prisma.companyEvent.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      success: true,
      event: updated,
    })
  } catch (error: any) {
    console.error('[WorkStuff Event PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireWorkMeAuth(request)

    const { id } = await params
    await prisma.companyEvent.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error: any) {
    console.error('[WorkStuff Event DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete event' },
      { status: 500 }
    )
  }
}
