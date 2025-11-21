import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import {
  parseCSV,
  validateColumns,
  previewRows,
} from '@/lib/services/ntk-csv-pipeline'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/ntk/csv-preview
 * Step 1: Validate CSV columns
 * Step 2: Preview rows (returns rows with stable inputIds)
 * 
 * Body: {
 *   csvContent: string (raw CSV text)
 * }
 * 
 * Returns: {
 *   success: true,
 *   headers: string[],
 *   mapping: CSVColumnMapping,
 *   previewRows: PreviewRow[],
 *   warnings?: string[]
 * }
 */
export async function POST(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    const body = await request.json()
    const { csvContent } = body

    console.log('[API POST /api/ntk/csv-preview]', {
      csvLength: csvContent?.length || 0,
      workMeId,
      companyId,
    })

    if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV content is required' },
        { status: 400 },
      )
    }

    // STEP 1: Parse CSV
    let parsed
    try {
      parsed = parseCSV(csvContent)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: `Failed to parse CSV: ${error.message}` },
        { status: 400 },
      )
    }

    // STEP 2: Validate columns
    const validation = validateColumns(parsed.headers)
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'CSV validation failed',
        },
        { status: 400 },
      )
    }

    // STEP 3: Preview rows
    const previewRowsData = previewRows(parsed.rows, validation.mapping!)

    console.log('[API POST /api/ntk/csv-preview] SUCCESS', {
      headerCount: parsed.headers.length,
      rowCount: previewRowsData.length,
      warnings: validation.warnings?.length || 0,
    })

    return NextResponse.json({
      success: true,
      headers: parsed.headers,
      mapping: validation.mapping,
      previewRows: previewRowsData,
      warnings: validation.warnings,
    })
  } catch (error: any) {
    console.error('❌ POST /api/ntk/csv-preview error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to preview CSV',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

