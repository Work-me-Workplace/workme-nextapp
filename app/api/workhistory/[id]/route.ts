import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/workhistory/[id]
 * 
 * Update WorkEntry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { companyName, title, startDate, endDate, description } = body

    // Verify ownership
    const existing = await prisma.workEntry.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.workMeId !== workMeId) {
      return NextResponse.json(
        { success: false, error: 'Work entry not found or access denied' },
        { status: 404 },
      )
    }

    const workEntry = await prisma.workEntry.update({
      where: { id: params.id },
      data: {
        companyName: companyName !== undefined ? companyName : undefined,
        title: title !== undefined ? title : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        description: description !== undefined ? description : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      workEntry,
    })
  } catch (error: any) {
    console.error('❌ WorkHistoryUpdate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update work entry' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/workhistory/[id]
 * 
 * Delete WorkEntry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // Verify ownership
    const existing = await prisma.workEntry.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.workMeId !== workMeId) {
      return NextResponse.json(
        { success: false, error: 'Work entry not found or access denied' },
        { status: 404 },
      )
    }

    await prisma.workEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('❌ WorkHistoryDelete error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete work entry' },
      { status: 500 },
    )
  }
}

