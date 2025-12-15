/**
 * API Route: GET /api/digital-signage/[id]
 * DELETE /api/digital-signage/[id]
 * 
 * Get or delete a single digital signage product
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAuth(request)
    const { id } = await params

    const signage = await prisma.productDigitalSign.findUnique({
      where: { id },
      include: {
        workforceAchievement: {
          include: {
            imageAsset: true,
          },
        },
        workforce: true,
        companyNews: true,
        companyEvent: true,
      }
    })

    if (!signage) {
      return NextResponse.json(
        { success: false, error: 'Digital signage not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      signage,
    })
  } catch (error: any) {
    console.error('[API] Failed to fetch digital signage:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch digital signage' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const { id } = await params

    // Get WorkMe to verify ownership
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: { id: true },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    // Verify the signage exists and belongs to the user
    const signage = await prisma.productDigitalSign.findUnique({
      where: { id },
      select: { 
        id: true,
        createdByWorkMeId: true,
      },
    })

    if (!signage) {
      return NextResponse.json(
        { success: false, error: 'Digital signage not found' },
        { status: 404 }
      )
    }

    if (signage.createdByWorkMeId !== workMe.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Delete the signage (cascade will handle related records)
    await prisma.productDigitalSign.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Digital signage deleted successfully',
    })
  } catch (error: any) {
    console.error('[API] Failed to delete digital signage:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete digital signage' },
      { status: 500 }
    )
  }
}
