import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/items
 * List all AdminWorkItems for the current user
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/admin/items] Starting...')

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    console.log('[API GET /api/admin/items] Auth verified:', { workMeId })

    // 3. Fetch all admin items for the user
    const items = await prisma.adminWorkItem.findMany({
      where: { workMeId },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    console.log('[API GET /api/admin/items] Success:', { itemCount: items.length })

    return NextResponse.json({
      success: true,
      items,
    })
  } catch (error: any) {
    console.error('[API GET /api/admin/items] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get admin items',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

