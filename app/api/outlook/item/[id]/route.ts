// TEMPORARILY COMMENTED OUT - Phase 1 WorkOps Refactor
// This file will be rebuilt in Phase 2 with WorkOps models

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
// import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * PUT /api/outlook/item/[id]
 * Update a MyWorkItem
 * TODO: Rebuild with WorkOpsItem in Phase 2
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    console.log('[API PUT /api/outlook/item/[id]] Starting...', { id })

    // TEMPORARILY DISABLED - Phase 1 refactor
    // const { firebaseId } = await verifyAuth(request as Request)
    // const workMeIdentity = await loadWorkMe(firebaseId)
    // const { id: workMeId } = workMeIdentity
    // const item = await prisma.myWorkItem.findUnique({ where: { id }, include: { outlook: true } })
    // if (!item || item.outlook.workMeId !== workMeId) { ... }
    // const updatedItem = await prisma.myWorkItem.update({ where: { id }, data: { ... } })

    return NextResponse.json({
      success: false,
      error: 'API temporarily disabled - Phase 1 WorkOps refactor in progress',
    }, { status: 503 })
  } catch (error: any) {
    console.error('[API PUT /api/outlook/item/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update item' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/outlook/item/[id]
 * Delete a MyWorkItem
 * TODO: Rebuild with WorkOpsItem in Phase 2
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    console.log('[API DELETE /api/outlook/item/[id]] Starting...', { id })

    // TEMPORARILY DISABLED - Phase 1 refactor
    // const { firebaseId } = await verifyAuth(request as Request)
    // const workMeIdentity = await loadWorkMe(firebaseId)
    // const { id: workMeId } = workMeIdentity
    // const item = await prisma.myWorkItem.findUnique({ where: { id }, include: { outlook: true } })
    // if (!item || item.outlook.workMeId !== workMeId) { ... }
    // await prisma.myWorkItem.delete({ where: { id } })

    return NextResponse.json({
      success: false,
      error: 'API temporarily disabled - Phase 1 WorkOps refactor in progress',
    }, { status: 503 })
  } catch (error: any) {
    console.error('[API DELETE /api/outlook/item/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete item' },
      { status: 500 },
    )
  }
}
