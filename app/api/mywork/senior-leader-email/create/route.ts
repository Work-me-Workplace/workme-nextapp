import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseSeniorLeaderTopics } from '@/lib/services/senior-leader-topic-parser'

export const dynamic = 'force-dynamic'

interface CreateSeniorLeaderEmailProductRequest {
  title?: string
  content: string
  saidBy?: string
  role?: string
  companyUnit?: string
}

/**
 * POST /api/mywork/senior-leader-email/create
 * 
 * Create a ProductSeniorLeaderEmail (product artifact) + parse topics
 * This is for MyWork section - "what did the boss say"
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkMeAuth(request)
    const body: CreateSeniorLeaderEmailProductRequest = await request.json()
    const { title, content, saidBy, role, companyUnit } = body

    // Validate content is required
    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Parse topics first
    const parseResult = await parseSeniorLeaderTopics(content.trim())

    // Create the product with content and topics
    const product = await prisma.productSeniorLeaderEmail.create({
      data: {
        companyUnit: companyUnit || null,
        createdByWorkMeId: auth.id,
        content: {
          create: {
            title: title || null,
            content: content.trim(),
            saidBy: saidBy || null,
            role: role || null,
          },
        },
        topics: {
          create: parseResult.topics.map((topic) => ({
            topic: topic.topic,
            description: topic.description,
          })),
        },
      },
      include: {
        content: true,
        topics: true,
      },
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('❌ POST /api/mywork/senior-leader-email/create error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create senior leader email product',
      },
      { status: 500 }
    )
  }
}
