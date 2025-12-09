// TEMPORARILY COMMENTED OUT - Phase 1 WorkOps Refactor
// This file will be rebuilt in Phase 2 with WorkOps models

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
// import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/items
 * List all AdminWorkItems for the current user
 * TODO: Rebuild with WorkOpsItem in Phase 2
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/admin/items] Starting...')

    // TEMPORARILY DISABLED - Phase 1 refactor
    // const { firebaseId } = await verifyAuth(request as Request)
    // const workMeIdentity = await loadWorkMe(firebaseId)
    // const { id: workMeId } = workMeIdentity
    // const items = await prisma.adminWorkItem.findMany({
    //   where: { workMeId },
    //   orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    // })

    return NextResponse.json({
      success: true,
      items: [], // TODO: Rebuild with WorkOpsItem in Phase 2
    })
  } catch (error: any) {
    console.error('[API GET /api/admin/items] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get admin items' },
      { status: 500 },
    )
  }
}
