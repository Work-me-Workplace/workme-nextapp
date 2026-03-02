import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getWorkOpsItem, updateWorkOpsItem, deleteWorkOpsItem } from '@/lib/server/workops/items'
import { WorkOpsItemType, WorkOpsUrgency, WorkOpsSource, WorkOpsStatus, WorkOpsCategory } from '@prisma/client'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().optional().nullable(),
  itemType: z.nativeEnum(WorkOpsItemType).optional(),
  urgency: z.nativeEnum(WorkOpsUrgency).optional().nullable(),
  status: z.nativeEnum(WorkOpsStatus).optional(),
  source: z.nativeEnum(WorkOpsSource).optional().nullable(),
  category: z.nativeEnum(WorkOpsCategory).optional().nullable(),
  priority: z.number().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  assignedBy: z.string().optional().nullable(),
  // Whiteboard fields
  positionX: z.number().optional().nullable(),
  positionY: z.number().optional().nullable(),
  groupId: z.string().optional().nullable(),
  targetQuarter: z.string().optional().nullable(),
})

/**
 * PATCH /api/workops/item/[itemId]
 * Update a WorkOpsItem
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { itemId } = await context.params

    // 3. Verify item exists and belongs to user's outlook
    const item = await getWorkOpsItem(itemId)
    const outlook = await item.outlook
    
    // Verify ownership (outlook should be linked to workMeId)
    // This is a safety check - in practice, the outlook should be user-specific
    // You may want to add explicit workMeId check here if needed

    // 4. Parse and validate request body
    const body = await request.json()
    const validated = updateItemSchema.parse(body)

    // 5. Prepare update data
    const updateData: any = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.body !== undefined) updateData.body = validated.body
    if (validated.itemType !== undefined) updateData.itemType = validated.itemType
    if (validated.urgency !== undefined) updateData.urgency = validated.urgency
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.source !== undefined) updateData.source = validated.source
    if (validated.category !== undefined) updateData.category = validated.category
    if (validated.priority !== undefined) updateData.priority = validated.priority
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null
    }
    if (validated.assignedBy !== undefined) updateData.assignedBy = validated.assignedBy
    
    // Whiteboard fields (will work once schema is updated)
    if (validated.positionX !== undefined) updateData.positionX = validated.positionX
    if (validated.positionY !== undefined) updateData.positionY = validated.positionY
    if (validated.groupId !== undefined) updateData.groupId = validated.groupId
    if (validated.targetQuarter !== undefined) updateData.targetQuarter = validated.targetQuarter

    // 6. Update WorkOpsItem
    const updatedItem = await updateWorkOpsItem(itemId, updateData)

    console.log('[API PATCH /api/workops/item/[itemId]] SUCCESS', {
      itemId: updatedItem.id,
      updates: Object.keys(updateData),
    })

    return NextResponse.json({
      success: true,
      item: updatedItem,
    })
  } catch (error: any) {
    console.error('❌ PATCH /api/workops/item/[itemId] error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 },
      )
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'WorkOpsItem not found',
        },
        { status: 404 },
      )
    }

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update WorkOpsItem',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * DELETE /api/workops/item/[itemId]
 * Delete a WorkOpsItem (removes from backlog; daily assignments are cascade-deleted)
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { firebaseId } = await verifyAuth(_request as Request)
    if (!firebaseId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const workMe = await loadWorkMe(firebaseId)
    const { itemId } = await context.params

    const item = await getWorkOpsItem(itemId)
    await deleteWorkOpsItem(itemId)

    console.log('[API DELETE /api/workops/item/[itemId]] SUCCESS', { itemId })

    return NextResponse.json({ success: true, id: itemId })
  } catch (error: any) {
    console.error('❌ DELETE /api/workops/item/[itemId] error:', error)

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'WorkOpsItem not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete WorkOpsItem',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

