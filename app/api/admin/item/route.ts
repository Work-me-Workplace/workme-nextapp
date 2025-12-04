import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/item
 * Create a new AdminWorkItem
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API POST /api/admin/item] Starting...')

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Parse request body
    const body = await request.json()
    const { title, notes, status } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required',
        },
        { status: 400 },
      )
    }

    // 4. Create the item
    const item = await prisma.adminWorkItem.create({
      data: {
        workMeId,
        title: title.trim(),
        notes: notes?.trim() || null,
        status: status || 'open',
      },
    })

    console.log('[API POST /api/admin/item] Success:', { itemId: item.id })

    return NextResponse.json({
      success: true,
      item,
    })
  } catch (error: any) {
    console.error('[API POST /api/admin/item] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create admin item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

