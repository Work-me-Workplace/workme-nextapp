import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/item/[id]
 * Update an AdminWorkItem
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log('[API PUT /api/admin/item/[id]] Starting...', { id: params.id })

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Verify the item belongs to the user
    const item = await prisma.adminWorkItem.findUnique({
      where: { id: params.id },
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

    if (item.workMeId !== workMeId) {
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
    const { title, notes, status } = body

    // 5. Update the item
    const updatedItem = await prisma.adminWorkItem.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(status !== undefined && { status }),
      },
    })

    console.log('[API PUT /api/admin/item/[id]] Success:', { itemId: updatedItem.id })

    return NextResponse.json({
      success: true,
      item: updatedItem,
    })
  } catch (error: any) {
    console.error('[API PUT /api/admin/item/[id]] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update admin item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * DELETE /api/admin/item/[id]
 * Delete an AdminWorkItem
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log('[API DELETE /api/admin/item/[id]] Starting...', { id: params.id })

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Verify the item belongs to the user
    const item = await prisma.adminWorkItem.findUnique({
      where: { id: params.id },
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

    if (item.workMeId !== workMeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 403 },
      )
    }

    // 4. Delete the item
    await prisma.adminWorkItem.delete({
      where: { id: params.id },
    })

    console.log('[API DELETE /api/admin/item/[id]] Success:', { itemId: params.id })

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('[API DELETE /api/admin/item/[id]] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete admin item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

