/**
 * API Route: POST /api/mywork/designworkpackage/create
 * 
 * Create a DesignWorkPackage for a digital signage product
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkMeAuth(request)
    const body = await request.json()
    const { signageId, title, description, assignedToWorkMeId } = body

    if (!signageId) {
      return NextResponse.json(
        { success: false, error: 'signageId is required' },
        { status: 400 }
      )
    }

    // Verify the signage exists
    const signage = await prisma.productDigitalSign.findUnique({
      where: { id: signageId },
      select: { id: true },
    })

    if (!signage) {
      return NextResponse.json(
        { success: false, error: 'Digital signage not found' },
        { status: 404 }
      )
    }

    // Create the design work package
    const workPackage = await prisma.designWorkPackage.create({
      data: {
        signageId,
        createdByWorkMeId: auth.id,
        assignedToWorkMeId: assignedToWorkMeId || null,
        title: title || `Design work for ${signageId}`,
        description: description || null,
        status: 'PENDING',
      },
      include: {
        signage: {
          select: {
            id: true,
            signType: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      workPackage,
    })
  } catch (error: any) {
    console.error('[API] Failed to create design work package:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create design work package' },
      { status: 500 }
    )
  }
}
