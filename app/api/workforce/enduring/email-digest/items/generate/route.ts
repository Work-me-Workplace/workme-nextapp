import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { generateDigestItem } from '@/lib/services/digest-item-generator-service'

/**
 * POST /api/workforce/enduring/email-digest/items/generate
 * Generate a formatted digest item from CompanyX data or manual input
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAuth(req)

    const body = await req.json()
    const { sourceType, sourceId, sourceData, humanContext } = body

    if (!sourceType || !sourceData) {
      return NextResponse.json(
        { success: false, error: 'sourceType and sourceData are required' },
        { status: 400 }
      )
    }

    // Call the AI generator service
    // sourceData is ALREADY PARSED from CompanyX models
    const formattedContent = await generateDigestItem({
      sourceType,
      sourceData, // Already has title, description, pocEmail, eventDate, etc.
      humanContext, // User's custom instructions
    })

    return NextResponse.json({
      success: true,
      formattedContent,
    })
  } catch (error) {
    console.error('Error generating digest item:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate item',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
