import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processNewsArticle } from '@/lib/services/platform-update-service'

export async function POST(request: Request) {
  try {
    const { platformUnitId, rawText, sourceUrl } = await request.json()

    if (!platformUnitId || !rawText) {
      return NextResponse.json(
        { success: false, error: 'Platform Unit ID and raw text are required' },
        { status: 400 }
      )
    }

    // Get the unit to find its platform product
    const unit = await prisma.companyPlatformUnit.findUnique({
      where: { id: platformUnitId },
      include: { platformProduct: true },
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Platform unit not found' },
        { status: 404 }
      )
    }

    // Create statement for the unit
    const statement = await prisma.companyPlatformUnitStatement.create({
      data: {
        platformUnitId,
        rawText,
        sourceUrl: sourceUrl || null,
        sourceName: null, // Could be extracted from URL or text
        headline: null, // Could be extracted from text
      },
    })

    // Create a basic update - in a real implementation, you'd parse this with AI
    const update = await prisma.companyPlatformUnitUpdate.create({
      data: {
        platformUnitId,
        statementId: statement.id,
        narrativeSummary: rawText.substring(0, 500), // Simplified - should use AI parsing
      },
    })

    // Check if milestones should be created from the update
    // This would be enhanced with AI parsing to detect milestone events

    return NextResponse.json({
      success: true,
      update,
      statement,
    })
  } catch (error: any) {
    console.error('Failed to create unit update:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
