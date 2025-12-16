import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params
    const statement = await request.json()

    if (!statement || !statement.rawText) {
      return NextResponse.json(
        { success: false, error: 'Statement rawText is required' },
        { status: 400 }
      )
    }

    // Verify unit exists
    const unit = await prisma.companyPlatformUnit.findUnique({
      where: { id: unitId },
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Platform unit not found' },
        { status: 404 }
      )
    }

    // Create statement
    const createdStatement = await prisma.companyPlatformUnitStatement.create({
      data: {
        platformUnitId: unitId,
        sourceName: statement.sourceName || undefined,
        sourceUrl: statement.sourceUrl || undefined,
        headline: statement.headline || undefined,
        rawText: statement.rawText,
        aiSummary: statement.aiSummary || undefined,
        aiTags: statement.aiTags || [],
      },
    })

    return NextResponse.json({
      success: true,
      statement: createdStatement,
    })
  } catch (error: any) {
    console.error('Failed to create statement:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create statement' },
      { status: 500 }
    )
  }
}
