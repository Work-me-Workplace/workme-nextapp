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
    console.error('❌ Error generating digest item:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : undefined,
    })
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate item',
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    )
  }
}
