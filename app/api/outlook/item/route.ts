// TEMPORARILY COMMENTED OUT - Phase 1 WorkOps Refactor
// This file will be rebuilt in Phase 2 with WorkOps models

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
// import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/outlook/item
 * Create a new MyWorkItem
 * TODO: Rebuild with WorkOpsItem in Phase 2
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API POST /api/outlook/item] Starting...')

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // TEMPORARILY DISABLED - Phase 1 refactor
    // const body = await request.json()
    // const { title, notes, status, dueDate, tag } = body
    // if (!title || typeof title !== 'string' || title.trim().length === 0) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'Title is required',
    //     },
    //     { status: 400 },
    //   )
    // }
    // let outlook = await prisma.myWorkOutlook.findUnique({
    //   where: { workMeId },
    // })
    // if (!outlook) {
    //   outlook = await prisma.myWorkOutlook.create({
    //     data: { workMeId },
    //   })
    // }
    // const item = await prisma.myWorkItem.create({
    //   data: {
    //     outlookId: outlook.id,
    //     title: title.trim(),
    //     notes: notes?.trim() || null,
    //     status: status || 'open',
    //     dueDate: dueDate ? new Date(dueDate) : null,
    //     tag: tag?.trim() || null,
    //   },
    // })

    return NextResponse.json({
      success: false,
      error: 'API temporarily disabled - Phase 1 WorkOps refactor in progress',
    }, { status: 503 })
  } catch (error: any) {
    console.error('[API POST /api/outlook/item] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}
