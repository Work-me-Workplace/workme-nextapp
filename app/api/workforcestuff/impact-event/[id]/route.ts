/**
 * Impact Event Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params

    const event = await prisma.companyImpactEvent.findFirst({
      where: {
        id,
        companyId,
      },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Impact event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error: any) {
    console.error('[Impact Event Detail] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch impact event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { data } = body

    const existing = await prisma.companyImpactEvent.findFirst({
      where: {
        id,
        companyId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Impact event not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.companyImpactEvent.update({
      where: { id },
      data: {
        ...data,
        // Preserve ingest fields
        ingestRawText: existing.ingestRawText,
        summary: data.summary ?? existing.summary,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error: any) {
    console.error('[Impact Event Update] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update impact event' },
      { status: 500 }
    )
  }
}



