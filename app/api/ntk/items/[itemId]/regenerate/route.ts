import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getItem, updateItem } from '@/lib/server/ntk-edition'
import { generateNTK } from '@/lib/services/ntk-generator'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/ntk/items/[itemId]/regenerate
 * Regenerate plain language for an item with optional feedback
 * 
 * Body: {
 *   feedback?: string
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: { itemId: string } },
) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe
    const { itemId } = params

    const body = await request.json()
    const { feedback } = body

    console.log('[API POST /api/ntk/items/[itemId]/regenerate]', {
      itemId,
      hasFeedback: !!feedback,
      workMeId,
      companyUnit,
      companyDivision,
    })

    // Get existing item
    const itemResult = await getItem(itemId, workMeId, companyUnit)
    const item = itemResult.item

    // Prepare source text from rawFields
    const rawFields = item.rawFields as Record<string, any>
    const sourceText = Object.entries(rawFields)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    // Generate with optional feedback
    const generated = await generateNTK(sourceText, feedback || item.feedback || undefined)

    // Extract plain language (summary from generated NTK)
    const plainLanguage = generated.summary

    // Update item with new plainLanguage and save feedback if provided
    const result = await updateItem(
      {
        itemId,
        feedback: feedback || item.feedback,
        plainLanguage,
        status: 'GENERATED' as any,
      },
      workMeId,
      companyUnit,
    )

    return NextResponse.json({
      success: true,
      plainLanguage,
      item: result.item,
    })
  } catch (error: any) {
    console.error('❌ POST /api/ntk/items/[itemId]/regenerate error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to regenerate item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

