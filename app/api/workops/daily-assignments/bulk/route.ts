import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { createDailyAssignment } from '@/lib/server/workops/daily-assignments'
import { getOrCreateOutlook } from '@/lib/server/workops/outlook'
import { getWorkOpsItem } from '@/lib/server/workops/items'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bulkSchema = z.object({
  itemIds: z.array(z.string()).min(1).max(200),
  day: z.string().transform((str) => new Date(str)),
})

/**
 * POST /api/workops/daily-assignments/bulk
 * Create multiple daily assignments in one request (single auth, avoids N requests).
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const outlook = await getOrCreateOutlook(workMe.id)

    const body = await request.json()
    const { itemIds, day } = bulkSchema.parse(body)

    const failed: string[] = []
    let created = 0

    for (const itemId of itemIds) {
      let title: string | null = null
      try {
        const item = await getWorkOpsItem(itemId)
        title = item.title
        if (item.outlookId !== outlook.id) {
          failed.push(title || itemId)
          continue
        }
        await createDailyAssignment({
          outlookId: outlook.id,
          itemId,
          day,
          dayIndex: null,
        })
        created += 1
      } catch (_) {
        failed.push(title || itemId)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      failed,
    })
  } catch (error: any) {
    console.error('❌ POST /api/workops/daily-assignments/bulk error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500
    return NextResponse.json(
      { success: false, error: error.message || 'Bulk assign failed' },
      { status }
    )
  }
}
