/**
 * WorkStuff Career Item API
 * 
 * GET /api/workstuff/career/[id] - Get single career
 * PUT /api/workstuff/career/[id] - Update career
 * DELETE /api/workstuff/career/[id] - Delete career
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
    const career = await prisma.companyCareer.findUnique({
      where: { id },
    })

    if (!career) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      career,
    })
  } catch (error: any) {
    console.error('[WorkStuff Career GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch career' },
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

    const existing = await prisma.companyCareer.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Career not found' },
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

    const updated = await prisma.companyCareer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      career: updated,
    })
  } catch (error: any) {
    console.error('[WorkStuff Career PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update career' },
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
    await prisma.companyCareer.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Career deleted successfully',
    })
  } catch (error: any) {
    console.error('[WorkStuff Career DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete career' },
      { status: 500 }
    )
  }
}
