import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getOrCreateOutlook } from '@/lib/server/workops/outlook'
import { autoCarryoverUncompletedTasks } from '@/lib/server/workops/auto-carryover'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/workops/daily-assignments/auto-carryover
 * Automatically carry forward uncompleted tasks from previous days to a target day
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    if (!firebaseId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Get or create outlook
    const outlook = await getOrCreateOutlook(workMeId)

    // 4. Parse request body (optional day, defaults to today)
    const body = await request.json().catch(() => ({}))
    const targetDay = body.day
      ? new Date(body.day)
      : new Date()

    // 5. Run auto-carryover
    const result = await autoCarryoverUncompletedTasks(
      outlook.id,
      targetDay
    )

    console.log('[API POST /api/workops/daily-assignments/auto-carryover] SUCCESS', {
      workMeId,
      targetDay: targetDay.toISOString(),
      carriedOver: result.carriedOver,
      failed: result.failed.length,
    })

    return NextResponse.json({
      success: true,
      carriedOver: result.carriedOver,
      failed: result.failed,
      errors: result.errors,
    })
  } catch (error: any) {
    console.error('❌ POST /api/workops/daily-assignments/auto-carryover error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to auto-carryover tasks',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
