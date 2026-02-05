import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import {
  getDailyAssignments,
  createDailyAssignment,
  getUnassignedItems,
} from '@/lib/server/workops/daily-assignments'
import { getOrCreateOutlook } from '@/lib/server/workops/outlook'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const createAssignmentSchema = z.object({
  itemId: z.string(),
  day: z.string().transform((str) => new Date(str)),
  dayIndex: z.number().optional().nullable(),
})

/**
 * GET /api/workops/daily-assignments
 * Get daily assignments for a specific day
 * Query params: day (ISO date string), outlookId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { searchParams } = new URL(request.url)
    const dayParam = searchParams.get('day')
    const outlookIdParam = searchParams.get('outlookId')
    const unassignedParam = searchParams.get('unassigned')

    // 3. Get or create outlook
    const outlook = await getOrCreateOutlook(workMeId)

    // If requesting unassigned items
    if (unassignedParam === 'true') {
      const unassignedItems = await getUnassignedItems(outlook.id)
      return NextResponse.json({
        success: true,
        items: unassignedItems,
      })
    }

    // Get assignments for a specific day
    if (!dayParam) {
      return NextResponse.json(
        { error: 'day parameter is required' },
        { status: 400 }
      )
    }

    const day = new Date(dayParam)
    if (isNaN(day.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const assignments = await getDailyAssignments(outlook.id, day)

    return NextResponse.json({
      success: true,
      assignments: assignments.map((a) => ({
        id: a.id,
        itemId: a.itemId,
        day: a.day.toISOString(),
        dayIndex: a.dayIndex,
        createdAt: a.createdAt.toISOString(),
        item: {
          id: a.item.id,
          title: a.item.title,
          body: a.item.body,
          itemType: a.item.itemType,
          urgency: a.item.urgency,
          status: a.item.status,
          source: a.item.source,
          dueDate: a.item.dueDate?.toISOString() || null,
          createdAt: a.item.createdAt.toISOString(),
          updatedAt: a.item.updatedAt.toISOString(),
        },
      })),
    })
  } catch (error: any) {
    console.error('❌ GET /api/workops/daily-assignments error:', error)

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get daily assignments',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status }
    )
  }
}

/**
 * POST /api/workops/daily-assignments
 * Create a daily assignment
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Parse and validate request body
    const body = await request.json()
    const validated = createAssignmentSchema.parse(body)

    // 4. Get or create outlook
    const outlook = await getOrCreateOutlook(workMeId)

    // Verify item belongs to this outlook
    const { getWorkOpsItem } = await import('@/lib/server/workops/items')
    const item = await getWorkOpsItem(validated.itemId)

    if (item.outlookId !== outlook.id) {
      return NextResponse.json(
        { error: 'Item does not belong to this outlook' },
        { status: 403 }
      )
    }

    const assignment = await createDailyAssignment({
      outlookId: outlook.id,
      itemId: validated.itemId,
      day: validated.day,
      dayIndex: validated.dayIndex || null,
    })

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        itemId: assignment.itemId,
        day: assignment.day.toISOString(),
        dayIndex: assignment.dayIndex,
        createdAt: assignment.createdAt.toISOString(),
        item: {
          id: assignment.item.id,
          title: assignment.item.title,
          body: assignment.item.body,
          itemType: assignment.item.itemType,
          urgency: assignment.item.urgency,
          status: assignment.item.status,
        },
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/workops/daily-assignments error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    const status = error.message?.includes('Unauthorized') || error.message?.includes('not found') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create daily assignment',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status }
    )
  }
}
