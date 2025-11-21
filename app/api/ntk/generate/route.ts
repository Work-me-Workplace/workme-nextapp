import { NextResponse } from 'next/server'
import { generateNTK, parseCSVToText } from '@/lib/services/ntk-generator'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { createStandaloneOutput } from '@/lib/server/work-output-standalone'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/ntk/generate
 * Generate structured NTK from raw text and save to WorkOutputStandalone
 * 
 * Body: {
 *   sourceText: string (raw text input)
 *   isCSV?: boolean (if true, parse CSV first)
 *   save?: boolean (if true, save to database)
 * }
 * 
 * Returns: {
 *   success: true,
 *   ntk: NTKStructure,
 *   outputId?: string (if saved)
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    const body = await request.json()
    const { sourceText, isCSV = false, save = false } = body

    console.log('[API POST /api/ntk/generate]', {
      textLength: sourceText?.length || 0,
      isCSV,
      save,
      workMeId,
      companyId,
    })

    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Source text is required' },
        { status: 400 },
      )
    }

    // Parse CSV if needed
    let processedText = sourceText
    if (isCSV) {
      try {
        processedText = parseCSVToText(sourceText)
      } catch (error: any) {
        return NextResponse.json(
          { success: false, error: `Failed to parse CSV: ${error.message}` },
          { status: 400 },
        )
      }
    }

    // Generate NTK using OpenAI
    const ntk = await generateNTK(processedText)

    console.log('[API POST /api/ntk/generate] NTK generated', {
      title: ntk.title,
      keyPointsCount: ntk.keyPoints.length,
    })

    let outputId: string | undefined

    // Save to database if requested
    if (save) {
      const result = await createStandaloneOutput(
        {
          outputType: 'ntk',
          title: ntk.title,
          description: ntk.summary,
          draftContent: ntk, // Store structured NTK in draftContent
          metadata: {
            sourceText: processedText, // Store original source in metadata
            isCSV,
            generatedAt: new Date().toISOString(),
          },
        },
        workMeId,
        companyId,
      )

      outputId = result.outputId

      console.log('[API POST /api/ntk/generate] Saved to database', {
        outputId,
      })
    }

    return NextResponse.json({
      success: true,
      ntk,
      outputId,
    })
  } catch (error: any) {
    console.error('❌ POST /api/ntk/generate error:', error)

    // Return 401 for auth errors, 500 for others
    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate NTK',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

