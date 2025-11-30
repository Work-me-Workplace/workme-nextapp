import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getEdition } from '@/lib/server/ntk-edition'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/ntk/editions/[editionId]
 * Get a single NTKEdition by ID with all items
 */
export async function GET(
  request: Request,
  { params }: { params: { editionId: string } },
) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth(request)
    const { editionId } = params

    console.log('[API GET /api/ntk/editions/[editionId]]', {
      editionId,
      workMeId,
      companyUnit,
      companyDivision,
    })

    const result = await getEdition(editionId, workMeId, companyUnit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ GET /api/ntk/editions/[editionId] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500
    const notFoundStatus = error.message?.includes('not found') ? 404 : status

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get edition',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: notFoundStatus },
    )
  }
}

