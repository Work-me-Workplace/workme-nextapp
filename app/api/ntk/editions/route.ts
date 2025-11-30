import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { createEdition, listEditions } from '@/lib/server/ntk-edition'
import type { PreviewRow } from '@/lib/services/ntk-csv-pipeline'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/ntk/editions
 * List all NTKEditions for the authenticated user's company
 */
export async function GET(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    console.log('[API GET /api/ntk/editions]', { workMeId, companyUnit, companyDivision })

    const result = await listEditions(companyUnit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ GET /api/ntk/editions error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list editions',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

/**
 * POST /api/ntk/editions
 * Create a new NTKEdition from preview rows
 * 
 * Body: {
 *   previewRows: PreviewRow[],
 *   title?: string,
 *   date?: string (ISO datetime)
 * }
 */
export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    const body = await request.json()
    const { previewRows, title, date } = body

    console.log('[API POST /api/ntk/editions]', {
      itemCount: previewRows?.length || 0,
      title,
      date,
      workMeId,
      companyUnit,
      companyDivision,
    })

    if (!previewRows || !Array.isArray(previewRows) || previewRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Preview rows are required' },
        { status: 400 },
      )
    }

    const result = await createEdition(
      previewRows as PreviewRow[],
      workMeId,
      companyUnit,
      companyDivision,
      title,
      date ? new Date(date) : undefined,
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ POST /api/ntk/editions error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create edition',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

