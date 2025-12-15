import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/signal/[id]
 * 
 * Get a SignalArtifact by ID with its topics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { id } = await params

    const artifact = await prisma.signalArtifact.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Signal artifact not found' },
        { status: 404 }
      )
    }

    // Verify user has access (created it)
    if (artifact.createdByWorkMeId !== auth.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      artifact,
    })
  } catch (error: any) {
    console.error('❌ GET /api/signal/[id] error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get signal artifact',
      },
      { status: 500 }
    )
  }
}
