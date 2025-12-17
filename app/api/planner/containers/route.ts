/**
 * API Routes: /api/planner/containers
 * 
 * POST - Create a new PlannerContainer
 * GET  - List all PlannerContainers for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/planner/containers
 * Create a new PlannerContainer
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
    const { name, description, timeframeLabel, divisionUnitId } = body

    // 4. Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      )
    }

    if (!workMe.companyId) {
      return NextResponse.json(
        { success: false, error: 'companyId is required for creating containers' },
        { status: 400 }
      )
    }

    // 5. Create PlannerContainer
    const container = await prisma.plannerContainer.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        timeframeLabel: timeframeLabel?.trim() || null,
        companyId: workMe.companyId,
        divisionUnitId: divisionUnitId?.trim() || workMe.companyUnit || null,
        ownerUserId: workMe.id,
      },
    })

    return NextResponse.json({
      success: true,
      container,
    })
  } catch (error: any) {
    console.error('[API POST /api/planner/containers] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create container',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/planner/containers
 * List all PlannerContainers for the authenticated user
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

    // 3. Fetch all containers owned by this user
    const containers = await prisma.plannerContainer.findMany({
      where: {
        ownerUserId: workMe.id,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      containers,
    })
  } catch (error: any) {
    console.error('[API GET /api/planner/containers] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch containers',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}


