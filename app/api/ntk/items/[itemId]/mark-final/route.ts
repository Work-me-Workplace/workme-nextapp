import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { markItemFinal } from '@/lib/server/ntk-edition'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * PATCH /api/ntk/items/[itemId]/mark-final
 * Mark an item as FINAL
 */
export async function PATCH(
  request: Request,
  { params }: { params: { itemId: string } },
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe
    const { itemId } = params

    console.log('[API PATCH /api/ntk/items/[itemId]/mark-final]', {
      itemId,
      workMeId,
      companyUnit,
      companyDivision,
    })

    const result = await markItemFinal(itemId, workMeId, companyUnit)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ PATCH /api/ntk/items/[itemId]/mark-final error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to mark item as final',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

