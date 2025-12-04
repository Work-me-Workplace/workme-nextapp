import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/outlook/item
 * Create a new MyWorkItem
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API POST /api/outlook/item] Starting...')

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    // 3. Parse request body
    const body = await request.json()
    const { title, notes, status, dueDate, tag } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required',
        },
        { status: 400 },
      )
    }

    // 4. Find or create MyWorkOutlook
    let outlook = await prisma.myWorkOutlook.findUnique({
      where: { workMeId },
    })

    if (!outlook) {
      outlook = await prisma.myWorkOutlook.create({
        data: { workMeId },
      })
    }

    // 5. Create the item
    const item = await prisma.myWorkItem.create({
      data: {
        outlookId: outlook.id,
        title: title.trim(),
        notes: notes?.trim() || null,
        status: status || 'open',
        dueDate: dueDate ? new Date(dueDate) : null,
        tag: tag?.trim() || null,
      },
    })

    console.log('[API POST /api/outlook/item] Success:', { itemId: item.id })

    return NextResponse.json({
      success: true,
      item,
    })
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

