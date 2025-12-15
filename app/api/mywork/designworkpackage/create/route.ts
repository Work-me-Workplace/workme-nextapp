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
    const { digitalSignId, title, description, assignedToWorkMeId } = body

    if (!digitalSignId) {
      return NextResponse.json(
        { success: false, error: 'digitalSignId is required' },
        { status: 400 }
      )
    }

    // Verify the signage exists
    const signage = await prisma.productDigitalSign.findUnique({
      where: { id: digitalSignId },
      select: { id: true },
    })

    if (!signage) {
      return NextResponse.json(
        { success: false, error: 'Digital signage not found' },
        { status: 404 }
      )
    }

    // Create the design work package
    // Work assignment: link to the digital product this work is for
    const workPackage = await prisma.designWorkPackage.create({
      data: {
        digitalSignId,
        createdByWorkMeId: auth.id,
        assignedToWorkMeId: assignedToWorkMeId || null,
        title: title || `Design work for ${digitalSignId}`,
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
