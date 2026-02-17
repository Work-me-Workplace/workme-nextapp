import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getOrCreateOutlook } from '@/lib/server/workops/outlook'
import { createWorkOpsItem } from '@/lib/server/workops/items'
import { splitBulkInput } from '@/lib/services/workops-ai-service'
import { WorkOpsItemType, WorkOpsSource } from '@prisma/client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createBulkSchema = z.object({
  rawText: z.string().min(1, 'Text is required'),
})

/**
 * POST /api/workops/item/create-bulk
 * Paste a list (lines or bullets); split and create one task per item. No AI.
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    if (!firebaseId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const workMe = await loadWorkMe(firebaseId)
    const outlook = await getOrCreateOutlook(workMe.id)

    const body = await request.json()
    const { rawText } = createBulkSchema.parse(body)

    const segments = splitBulkInput(rawText.trim())
    if (segments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items to create' },
        { status: 400 }
      )
    }

    const items = []
    for (const segment of segments) {
      const title = segment.length > 200 ? segment.slice(0, 197) + '...' : segment
      const body = segment.length > 200 ? segment : null
      const item = await createWorkOpsItem({
        outlookId: outlook.id,
        title,
        body,
        itemType: WorkOpsItemType.task,
        source: WorkOpsSource.manual,
      })
      items.push(item)
    }

    console.log('[API POST /api/workops/item/create-bulk] SUCCESS', { count: items.length })

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
    })
  } catch (error: any) {
    console.error('❌ POST /api/workops/item/create-bulk error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create tasks',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
