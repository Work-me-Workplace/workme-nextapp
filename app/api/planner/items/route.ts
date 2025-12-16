/**
 * API Routes: /api/planner/items
 * 
 * POST - Create a new PlannedItem
 * GET  - List PlannedItems (optionally filtered by containerId)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/planner/items
 * Create a new PlannedItem
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Get WorkMe to get companyId and workMeId
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        companyId: true,
        companyUnit: true,
      },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    // 3. Parse request body
    const body = await request.json()
    const {
      plannerContainerId,
      itemKind,
      title,
      description,
      plannedTimeLabel,
      plannedTimeAnchor,
      notes,
      divisionUnitId,
      sourceEventId,
      sourceCampaignId,
      sourceProgramId,
    } = body

    // 4. Validate required fields
    if (!plannerContainerId || typeof plannerContainerId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'plannerContainerId is required' },
        { status: 400 }
      )
    }

    if (!itemKind || typeof itemKind !== 'string' || itemKind.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'itemKind is required' },
        { status: 400 }
      )
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      )
    }

    if (!plannedTimeLabel || typeof plannedTimeLabel !== 'string' || plannedTimeLabel.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'plannedTimeLabel is required' },
        { status: 400 }
      )
    }

    if (!workMe.companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required for creating items' },
        { status: 400 }
      )
    }

    // 5. Verify container exists and belongs to user
    const container = await prisma.plannerContainer.findUnique({
      where: { id: plannerContainerId },
      select: {
        id: true,
        ownerUserId: true,
        companyId: true,
      },
    })

    if (!container) {
      return NextResponse.json(
        { success: false, error: 'PlannerContainer not found' },
        { status: 404 }
      )
    }

    if (container.ownerUserId !== workMe.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Container does not belong to user' },
        { status: 403 }
      )
    }

    // 6. Parse plannedTimeAnchor if provided
    let parsedTimeAnchor: Date | null = null
    if (plannedTimeAnchor) {
      parsedTimeAnchor = new Date(plannedTimeAnchor)
      if (isNaN(parsedTimeAnchor.getTime())) {
        return NextResponse.json(
          { success: false, error: 'plannedTimeAnchor must be a valid date' },
          { status: 400 }
        )
      }
    }

    // 7. Create PlannedItem
    const item = await prisma.plannedItem.create({
      data: {
        plannerContainerId,
        companyId: workMe.companyId,
        divisionUnitId: divisionUnitId?.trim() || workMe.companyUnit || null,
        sourceEventId: sourceEventId?.trim() || null,
        sourceCampaignId: sourceCampaignId?.trim() || null,
        sourceProgramId: sourceProgramId?.trim() || null,
        itemKind: itemKind.trim(),
        title: title.trim(),
        description: description?.trim() || null,
        plannedTimeLabel: plannedTimeLabel.trim(),
        plannedTimeAnchor: parsedTimeAnchor,
        notes: notes?.trim() || null,
        createdByUserId: workMe.id,
      },
    })

    return NextResponse.json({
      success: true,
      item,
    })
  } catch (error: any) {
    console.error('[API POST /api/planner/items] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/planner/items
 * List PlannedItems (optionally filtered by containerId)
 * Query params: ?containerId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const { firebaseId } = await verifyAuth(request)
    
    // 2. Get WorkMe to get workMeId
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
      },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    // 3. Get query params
    const { searchParams } = new URL(request.url)
    const containerId = searchParams.get('containerId')

    // 4. Build where clause
    const where: any = {}
    
    if (containerId) {
      // Verify container belongs to user
      const container = await prisma.plannerContainer.findUnique({
        where: { id: containerId },
        select: {
          id: true,
          ownerUserId: true,
        },
      })

      if (!container) {
        return NextResponse.json(
          { success: false, error: 'PlannerContainer not found' },
          { status: 404 }
        )
      }

      if (container.ownerUserId !== workMe.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Container does not belong to user' },
          { status: 403 }
        )
      }

      where.plannerContainerId = containerId
    } else {
      // If no containerId, get all containers owned by user and filter items
      const userContainers = await prisma.plannerContainer.findMany({
        where: {
          ownerUserId: workMe.id,
        },
        select: {
          id: true,
        },
      })

      where.plannerContainerId = {
        in: userContainers.map(c => c.id),
      }
    }

    // 5. Fetch items
    const items = await prisma.plannedItem.findMany({
      where,
      include: {
        plannerContainer: {
          select: {
            id: true,
            name: true,
            timeframeLabel: true,
          },
        },
      },
      orderBy: [
        { plannedTimeAnchor: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      items,
    })
  } catch (error: any) {
    console.error('[API GET /api/planner/items] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch items',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
