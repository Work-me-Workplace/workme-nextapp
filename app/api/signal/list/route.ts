import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/signal/list
 * 
 * List all SignalArtifacts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireWorkMeAuth(request)

    // Get all artifacts created by this user
    const artifacts = await prisma.signalArtifact.findMany({
      where: {
        createdByWorkMeId: auth.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        saidBy: true,
        role: true,
        source: true,
        createdAt: true,
        _count: {
          select: {
            topics: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      artifacts,
    })
  } catch (error: any) {
    console.error('❌ GET /api/signal/list error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list signal artifacts',
      },
      { status: 500 }
    )
  }
}





