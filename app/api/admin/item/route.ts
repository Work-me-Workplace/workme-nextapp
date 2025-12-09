// TEMPORARILY COMMENTED OUT - Phase 1 WorkOps Refactor
// This file will be rebuilt in Phase 2 with WorkOps models

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
// import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/item
 * Create a new AdminWorkItem
 * TODO: Rebuild with WorkOpsItem in Phase 2
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API POST /api/admin/item] Starting...')

    // TEMPORARILY DISABLED - Phase 1 refactor
    // const { firebaseId } = await verifyAuth(request as Request)
    // const workMeIdentity = await loadWorkMe(firebaseId)
    // const { id: workMeId } = workMeIdentity
    // const body = await request.json()
    // const { title, notes, status } = body
    // const item = await prisma.adminWorkItem.create({ data: { workMeId, title, notes, status } })

    return NextResponse.json({
      success: false,
      error: 'API temporarily disabled - Phase 1 WorkOps refactor in progress',
    }, { status: 503 })
  } catch (error: any) {
    console.error('[API POST /api/admin/item] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create admin item' },
      { status: 500 },
    )
  }
}
