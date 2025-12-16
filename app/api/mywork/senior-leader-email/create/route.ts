import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { parseSeniorLeaderTopics } from '@/lib/services/senior-leader-topic-parser'

export const dynamic = 'force-dynamic'

interface CreateSeniorLeaderEmailProductRequest {
  title?: string
  actualSubjectLine?: string
  content: string
  role: string // SeniorLeaderRole enum
  companyEmployeeId?: string // FK to CompanyEmployee
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
    const { title, actualSubjectLine, content, role, companyEmployeeId, companyUnit } = body

    // Validate content is required
    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Validate role is required
    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      )
    }

    // Validate role is a valid enum value
    const validRoles = ['SES', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'EXECUTIVE_DIRECTOR', 'CHIEF', 'DEPUTY_CHIEF', 'COMMANDER', 'DEPUTY_COMMANDER', 'OTHER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
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
            actualSubjectLine: actualSubjectLine || null,
            content: content.trim(),
            role: role as any, // Prisma enum
            companyEmployeeId: companyEmployeeId || null,
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
        content: {
          include: {
            companyEmployee: {
              select: {
                id: true,
                fullName: true,
                title: true,
                email: true,
              },
            },
          },
        },
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
