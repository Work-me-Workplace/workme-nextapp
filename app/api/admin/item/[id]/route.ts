// TEMPORARILY COMMENTED OUT - Phase 1 WorkOps Refactor
// This file will be rebuilt in Phase 2 with WorkOps models

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
// import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/item/[id]
 * Update an AdminWorkItem
 * TODO: Rebuild with WorkOpsItem in Phase 2
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[API PUT /api/admin/item/[id]] Starting...', { id })

    // TEMPORARILY DISABLED - Phase 1 refactor
    // const { firebaseId } = await verifyAuth(request)
    // const workMeIdentity = await loadWorkMe(firebaseId)
    // const { id: workMeId } = workMeIdentity
    // const item = await prisma.adminWorkItem.findUnique({ where: { id } })
    // if (!item || item.workMeId !== workMeId) { ... }
    // const updatedItem = await prisma.adminWorkItem.update({ where: { id }, data: { ... } })

    return NextResponse.json({
      success: false,
      error: 'API temporarily disabled - Phase 1 WorkOps refactor in progress',
    }, { status: 503 })
  } catch (error: any) {
    console.error('[API PUT /api/admin/item/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update admin item' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/admin/item/[id]
 * Delete an AdminWorkItem
 * TODO: Rebuild with WorkOpsItem in Phase 2
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[API DELETE /api/admin/item/[id]] Starting...', { id })

    // TEMPORARILY DISABLED - Phase 1 refactor
    // const { firebaseId } = await verifyAuth(request)
    // const workMeIdentity = await loadWorkMe(firebaseId)
    // const { id: workMeId } = workMeIdentity
    // const item = await prisma.adminWorkItem.findUnique({ where: { id } })
    // if (!item || item.workMeId !== workMeId) { ... }
    // await prisma.adminWorkItem.delete({ where: { id } })

    return NextResponse.json({
      success: false,
      error: 'API temporarily disabled - Phase 1 WorkOps refactor in progress',
    }, { status: 503 })
  } catch (error: any) {
    console.error('[API DELETE /api/admin/item/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete admin item' },
      { status: 500 },
    )
  }
}
