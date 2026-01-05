import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface CreateSignalArtifactRequest {
  title?: string
  content: string
  saidBy?: string
  role?: string
  source?: string
}

/**
 * POST /api/signal/create
 * 
 * Create a new SignalArtifact (raw memory, immutable)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkMeAuth(request)
    const body: CreateSignalArtifactRequest = await request.json()
    const { title, content, saidBy, role, source } = body

    // Validate content is required
    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Create the signal artifact
    const artifact = await prisma.signalArtifact.create({
      data: {
        title: title || null,
        content: content.trim(),
        saidBy: saidBy || null,
        role: role || null,
        source: source || 'senior_leader_email',
        createdByWorkMeId: auth.id,
      },
    })

    return NextResponse.json({
      success: true,
      artifact,
    })
  } catch (error: any) {
    console.error('❌ POST /api/signal/create error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create signal artifact',
      },
      { status: 500 }
    )
  }
}






