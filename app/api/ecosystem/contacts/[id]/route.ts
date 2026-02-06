/**
 * PATCH /api/ecosystem/contacts/[id]
 * DELETE /api/ecosystem/contacts/[id]
 * 
 * Update or delete a MyEcosystemContact relationship
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)

    const { id } = await params
    const body = await request.json()

    // Verify contact belongs to this user
    const existing = await prisma.myEcosystemContact.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }

    if (existing.workMeId !== workMe.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update contact
    const contact = await prisma.myEcosystemContact.update({
      where: { id },
      data: {
        ...(body.stance !== undefined && { stance: body.stance }),
        ...(body.relationshipType !== undefined && { relationshipType: body.relationshipType }),
        ...(body.followForXFeed !== undefined && { followForXFeed: body.followForXFeed }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.lastInteractedAt !== undefined && { lastInteractedAt: body.lastInteractedAt ? new Date(body.lastInteractedAt) : null }),
      },
      include: {
        person: true,
      },
    })

    return NextResponse.json({
      success: true,
      contact,
    })
  } catch (error: any) {
    console.error('[PATCH /api/ecosystem/contacts/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contact' },
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
    const workMe = await loadWorkMe(firebaseId)

    const { id } = await params

    // Verify contact belongs to this user
    const existing = await prisma.myEcosystemContact.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      )
    }

    if (existing.workMeId !== workMe.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.myEcosystemContact.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Contact deleted',
    })
  } catch (error: any) {
    console.error('[DELETE /api/ecosystem/contacts/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
