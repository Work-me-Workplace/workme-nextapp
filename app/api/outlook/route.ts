import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/outlook
 * Fetch or create MyWorkOutlook for the current user
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/outlook] Starting...')

    // 1. Verify Firebase auth token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMeIdentity = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMeIdentity

    console.log('[API GET /api/outlook] Auth verified:', { workMeId })

    // 3. Find or create MyWorkOutlook
    let outlook = await prisma.myWorkOutlook.findUnique({
      where: { workMeId },
      include: {
        items: {
          orderBy: [
            { status: 'asc' },
            { createdAt: 'desc' },
          ],
        },
      },
    })

    // If not found, create it
    if (!outlook) {
      outlook = await prisma.myWorkOutlook.create({
        data: {
          workMeId,
        },
        include: {
          items: {
            orderBy: [
              { status: 'asc' },
              { createdAt: 'desc' },
            ],
          },
        },
      })
    }

    console.log('[API GET /api/outlook] Success:', { outlookId: outlook.id, itemCount: outlook.items.length })

    return NextResponse.json({
      success: true,
      outlook: {
        id: outlook.id,
        workMeId: outlook.workMeId,
        createdAt: outlook.createdAt,
        updatedAt: outlook.updatedAt,
        items: outlook.items,
      },
    })
  } catch (error: any) {
    console.error('[API GET /api/outlook] Error:', {
      error: error.message,
      stack: error.stack,
    })

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get outlook',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

