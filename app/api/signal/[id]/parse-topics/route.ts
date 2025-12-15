import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseSeniorLeaderTopics } from '@/lib/services/senior-leader-topic-parser'

export const dynamic = 'force-dynamic'

/**
 * POST /api/signal/[id]/parse-topics
 * 
 * Parse topics from a SignalArtifact using AI
 * Creates SeniorLeaderTopic records linked to the SignalArtifact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireWorkMeAuth(request)
    const { id } = await params

    // Find the signal artifact
    const artifact = await prisma.signalArtifact.findUnique({
      where: { id },
    })

    if (!artifact) {
      return NextResponse.json(
        { success: false, error: 'Signal artifact not found' },
        { status: 404 }
      )
    }

    // Parse topics using AI
    const parseResult = await parseSeniorLeaderTopics(artifact.content)

    // Delete existing topics for this artifact (upsert behavior)
    await prisma.seniorLeaderTopic.deleteMany({
      where: { signalArtifactId: id },
    })

    // Create new topics
    const topics = await Promise.all(
      parseResult.topics.map((topic) =>
        prisma.seniorLeaderTopic.create({
          data: {
            signalArtifactId: id,
            topic: topic.topic,
            description: topic.description,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      topics,
    })
  } catch (error: any) {
    console.error('❌ POST /api/signal/[id]/parse-topics error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse topics',
      },
      { status: 500 }
    )
  }
}
