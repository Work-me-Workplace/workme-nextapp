/**
 * WorkStuff Training Item API
 * 
 * GET /api/workstuff/training/[id] - Get single training
 * PUT /api/workstuff/training/[id] - Update training
 * DELETE /api/workstuff/training/[id] - Delete training
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
    const training = await prisma.companyTraining.findUnique({
      where: { id },
    })

    if (!training) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      training,
    })
  } catch (error: any) {
    console.error('[WorkStuff Training GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch training' },
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

    const existing = await prisma.companyTraining.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Training not found' },
        { status: 404 }
      )
    }

    if (companyId && existing.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: companyId mismatch' },
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
    if (existing.ingestType !== undefined) {
      updateData.ingestType = existing.ingestType
    }
    if (existing.ingestCreatedAt !== undefined) {
      updateData.ingestCreatedAt = existing.ingestCreatedAt
    }

    const updated = await prisma.companyTraining.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      training: updated,
    })
  } catch (error: any) {
    console.error('[WorkStuff Training PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update training' },
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
    await prisma.companyTraining.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Training deleted successfully',
    })
  } catch (error: any) {
    console.error('[WorkStuff Training DELETE] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete training' },
      { status: 500 }
    )
  }
}
