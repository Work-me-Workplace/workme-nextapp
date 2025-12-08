import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * PUT /api/outlook/item/[id]
 * Update a MyWorkItem
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    console.log('[API PUT /api/outlook/item/[id]] Starting...', { id })

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Verify the item belongs to the user's outlook
    const item = await prisma.myWorkItem.findUnique({
      where: { id },
      include: {
        outlook: true,
      },
    })

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 },
      )
    }

    if (item.outlook.workMeId !== workMeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 },
      )
    }

    // 4. Parse request body
    const body = await request.json()
    const { title, notes, status, dueDate, tag } = body

    // 5. Update the item
    const updatedItem = await prisma.myWorkItem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(tag !== undefined && { tag: tag?.trim() || null }),
      },
    })

    console.log('[API PUT /api/outlook/item/[id]] Success:', { itemId: updatedItem.id })

    return NextResponse.json({
      success: true,
      item: updatedItem,
    })
  } catch (error: any) {
    console.error('[API PUT /api/outlook/item/[id]] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * DELETE /api/outlook/item/[id]
 * Delete a MyWorkItem
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    console.log('[API DELETE /api/outlook/item/[id]] Starting...', { id })

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Verify the item belongs to the user's outlook
    const item = await prisma.myWorkItem.findUnique({
      where: { id },
      include: {
        outlook: true,
      },
    })

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 },
      )
    }

    if (item.outlook.workMeId !== workMeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 },
      )
    }

    // 4. Delete the item
    await prisma.myWorkItem.delete({
      where: { id },
    })

    console.log('[API DELETE /api/outlook/item/[id]] Success:', { itemId: id })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('[API DELETE /api/outlook/item/[id]] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

