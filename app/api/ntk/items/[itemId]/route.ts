import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getItem, updateItem } from '@/lib/server/ntk-edition'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/ntk/items/[itemId]
 * Get a single NTKItem by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { itemId: string } },
) {
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    const { itemId } = params

    console.log('[API GET /api/ntk/items/[itemId]]', {
      itemId,
      workMeId,
      companyId,
    })

    const result = await getItem(itemId, workMeId, companyId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ GET /api/ntk/items/[itemId] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500
    const notFoundStatus = error.message?.includes('not found') ? 404 : status

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: notFoundStatus },
    )
  }
}

/**
 * PUT /api/ntk/items/[itemId]
 * Update an NTKItem (feedback, plainLanguage, status)
 * 
 * Body: {
 *   feedback?: string,
 *   plainLanguage?: string,
 *   status?: NTKStatus
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: { itemId: string } },
) {
  try {
    const { workMeId, companyId } = await verifyAuth(request)
    const { itemId } = params

    const body = await request.json()
    const { feedback, plainLanguage, status } = body

    console.log('[API PUT /api/ntk/items/[itemId]]', {
      itemId,
      hasFeedback: !!feedback,
      hasPlainLanguage: !!plainLanguage,
      status,
      workMeId,
      companyId,
    })

    const result = await updateItem(
      {
        itemId,
        feedback,
        plainLanguage,
        status,
      },
      workMeId,
      companyId,
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ PUT /api/ntk/items/[itemId] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}


