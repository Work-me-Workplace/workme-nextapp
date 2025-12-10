/**
 * WorkStuff Cause Item API
 * 
 * GET /api/workstuff/cause/[id] - Get single cause
 * PUT /api/workstuff/cause/[id] - Update cause
 * DELETE /api/workstuff/cause/[id] - Delete cause
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
    const cause = await prisma.companyEmployeeCause.findUnique({
      where: { id },
    })

    if (!cause) {
      return NextResponse.json(
        { success: false, error: 'Cause not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      cause,
    })
  } catch (error: any) {
    console.error('[WorkStuff Cause GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cause' },
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
    const { data, companyUnitId } = body

    const existing = await prisma.companyEmployeeCause.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cause not found' },
        { status: 404 }
      )
    }

    if (companyUnitId && existing.companyUnit !== companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: companyUnit mismatch' },
        { status: 403 }
      )
    }

    // Preserve ingest fields
    const updateData: any = {
      ...data,
    }
    if (existing.ingestRawText !== undefined) {
      updateData.ingestRawText = existing.ingestRawText
    }

    const updated = await prisma.companyEmployeeCause.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      cause: updated,
    })
  } catch (error: any) {
    console.error('[WorkStuff Cause PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cause' },
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
    await prisma.companyEmployeeCause.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Cause deleted successfully',
    })
  } catch (error: any) {
    console.error('[WorkStuff Cause DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete cause' },
      { status: 500 }
    )
  }
}
