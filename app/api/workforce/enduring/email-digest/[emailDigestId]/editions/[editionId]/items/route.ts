/**
 * API Route: Edition Items Management
 * POST - Add items to edition
 * DELETE - Remove item from edition
 * PUT - Update item order in edition
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { z } from 'zod'

const addItemsSchema = z.object({
  itemIds: z.array(z.string()).min(1, 'At least one item is required'),
})

const updateOrderSchema = z.object({
  itemId: z.string(),
  order: z.number().int().min(0),
})

/**
 * POST /api/workforce/enduring/email-digest/[emailDigestId]/editions/[editionId]/items
 * Add items to an edition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ emailDigestId: string; editionId: string }> }
) {
  try {
    const { editionId } = await params
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = addItemsSchema.parse(body)

    // Verify edition exists and belongs to user's company
    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyId,
      },
    })

    if (!edition) {
      return NextResponse.json(
        { success: false, error: 'Email digest edition not found' },
        { status: 404 }
      )
    }

    // Verify all items exist and belong to user's company
    const items = await prisma.emailDigestItem.findMany({
      where: {
        id: { in: validated.itemIds },
        companyId,
      },
    })

    if (items.length !== validated.itemIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more items not found' },
        { status: 404 }
      )
    }

    // Get current max order for this edition
    const maxOrderResult = await prisma.emailDigestEditionItem.findFirst({
      where: { editionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = (maxOrderResult?.order ?? -1) + 1

    // Create junction records
    const created = await prisma.emailDigestEditionItem.createMany({
      data: validated.itemIds.map((itemId, index) => ({
        editionId,
        itemId,
        order: nextOrder + index,
      })),
      skipDuplicates: true, // Skip if item already in edition
    })

    return NextResponse.json({
      success: true,
      added: created.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      )
    }
    console.error('Error adding items to edition:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add items to edition' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workforce/enduring/email-digest/[emailDigestId]/editions/[editionId]/items
 * Remove an item from an edition
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ emailDigestId: string; editionId: string }> }
) {
  try {
    const { editionId } = await params
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify edition exists and belongs to user's company
    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyId,
      },
    })

    if (!edition) {
      return NextResponse.json(
        { success: false, error: 'Email digest edition not found' },
        { status: 404 }
      )
    }

    // Delete the junction record
    await prisma.emailDigestEditionItem.deleteMany({
      where: {
        editionId,
        itemId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing item from edition:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove item from edition' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workforce/enduring/email-digest/[emailDigestId]/editions/[editionId]/items
 * Update item order in edition
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ emailDigestId: string; editionId: string }> }
) {
  try {
    const { editionId } = await params
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = updateOrderSchema.parse(body)

    // Verify edition exists and belongs to user's company
    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyId,
      },
    })

    if (!edition) {
      return NextResponse.json(
        { success: false, error: 'Email digest edition not found' },
        { status: 404 }
      )
    }

    // Update the order
    await prisma.emailDigestEditionItem.updateMany({
      where: {
        editionId,
        itemId: validated.itemId,
      },
      data: {
        order: validated.order,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating item order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update item order' },
      { status: 500 }
    )
  }
}

