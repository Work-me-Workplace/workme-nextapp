/**
 * API Route: POST /api/mywork/digital-signage/[id]/archive
 * 
 * Archive a digital signage product
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { id } = await params

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

    if (signage.createdByWorkMeId !== auth.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Archive the signage
    const updated = await prisma.productDigitalSign.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      signage: updated,
    })
  } catch (error: any) {
    console.error('[API] Failed to archive digital signage:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to archive digital signage' },
      { status: 500 }
    )
  }
}



