import { NextResponse } from 'next/server'
import { generateNTK } from '@/lib/services/ntk-generator'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { createNTK } from '@/lib/server/ntk'

/**
 * Parse CSV text into sourceText
 * Simple CSV parser for NTK input
 */
function parseCSVToText(csvContent: string): string {
  const lines = csvContent.trim().split('\n')
  
  // Skip header row if it exists
  const dataLines = lines.slice(1).filter(line => line.trim().length > 0)
  
  // Join all rows into text
  return dataLines.join('\n\n')
}

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
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const body = await request.json()
    const { sourceText, isCSV = false, save = false } = body

    console.log('[API POST /api/ntk/generate]', {
      textLength: sourceText?.length || 0,
      isCSV,
      save,
      workMeId,
      companyUnit,
      companyDivision,
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
      header: ntk.header,
      poc: ntk.poc,
    })

    let ntkId: string | undefined

    // Save to database if requested
    if (save) {
      const result = await createNTK(
        {
          header: ntk.header,
          poc: ntk.poc,
          summary: ntk.summary,
          sourceText: processedText,
          draftContent: ntk, // Store full structure
          metadata: {
            isCSV,
            generatedAt: new Date().toISOString(),
          },
        },
        workMeId,
        companyUnit,
        companyDivision,
      )

      ntkId = result.ntkId

      console.log('[API POST /api/ntk/generate] Saved to database', {
        ntkId,
      })
    }

    return NextResponse.json({
      success: true,
      ntk,
      ntkId,
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

