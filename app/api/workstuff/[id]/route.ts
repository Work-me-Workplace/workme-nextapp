/**
 * WorkStuff Item API
 * 
 * GET /api/workstuff/[id] - Get a single WorkStuff item
 * PUT /api/workstuff/[id] - Update a WorkStuff item
 * DELETE /api/workstuff/[id] - Delete a WorkStuff item
 * 
 * AUTH: WorkMe-only (Firebase → WorkMe)
 * SCOPE: companyUnitId from record
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { CONTEXT_TYPE_TO_MODEL } from '@/lib/services/companyx-mapper'
import type { ContextType } from '@/lib/types/context-type'

export const dynamic = 'force-dynamic'

/**
 * GET /api/workstuff/[id]
 * 
 * Get a single WorkStuff item by ID
 * Query params:
 * - type: ContextType (required) - to determine which model to query
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContextType

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'type query parameter is required' },
        { status: 400 }
      )
    }

    const validTypes: ContextType[] = [
      'training',
      'career',
      'event',
      'campaign',
      'impact_event',
      'community',
      'benefits',
      'employee_cause',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const modelName = CONTEXT_TYPE_TO_MODEL[type]
    const record = await (prisma as any)[modelName].findUnique({
      where: { id },
    })

    if (!record) {
      return NextResponse.json(
        { success: false, error: `${type} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      id: record.id,
      type,
      [modelName]: record,
    })
  } catch (error: any) {
    console.error('[WorkStuff API GET /[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch WorkStuff item' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/workstuff/[id]
 * 
 * Update a WorkStuff item
 * Body:
 * - type: ContextType (required)
 * - data: object (fields to update)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { id } = await params
    const body = await request.json()
    const { type, data, companyUnitId } = body

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'type is required' },
        { status: 400 }
      )
    }

    const validTypes: ContextType[] = [
      'training',
      'career',
      'event',
      'campaign',
      'impact_event',
      'community',
      'benefits',
      'employee_cause',
    ]

    if (!validTypes.includes(type as ContextType)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const modelName = CONTEXT_TYPE_TO_MODEL[type as ContextType]

    // Check if record exists
    const existing = await (prisma as any)[modelName].findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `${type} not found` },
        { status: 404 }
      )
    }

    // Security check: verify companyUnit if provided
    if (companyUnitId && existing.companyUnit !== companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: companyUnit mismatch' },
        { status: 403 }
      )
    }

    // Prepare update data - preserve ingest fields
    const updateData: any = {
      ...data,
    }

    // Don't overwrite ingest fields if they exist
    if (existing.ingestRawText !== undefined) {
      updateData.ingestRawText = existing.ingestRawText
    }
    if (existing.ingestType !== undefined) {
      updateData.ingestType = existing.ingestType
    }
    if (existing.ingestCreatedAt !== undefined) {
      updateData.ingestCreatedAt = existing.ingestCreatedAt
    }

    // Update the record
    const updated = await (prisma as any)[modelName].update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      id: updated.id,
      type,
      [modelName]: updated,
    })
  } catch (error: any) {
    console.error('[WorkStuff API PUT /[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update WorkStuff item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workstuff/[id]
 * 
 * Delete a WorkStuff item
 * Query params:
 * - type: ContextType (required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AUTH: WorkMe-only
    await requireWorkMeAuth(request)

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as ContextType

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'type query parameter is required' },
        { status: 400 }
      )
    }

    const validTypes: ContextType[] = [
      'training',
      'career',
      'event',
      'campaign',
      'impact_event',
      'community',
      'benefits',
      'employee_cause',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const modelName = CONTEXT_TYPE_TO_MODEL[type]

    // Check if record exists
    const existing = await (prisma as any)[modelName].findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: `${type} not found` },
        { status: 404 }
      )
    }

    // Delete the record
    await (prisma as any)[modelName].delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `${type} deleted successfully`,
    })
  } catch (error: any) {
    console.error('[WorkStuff API DELETE /[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete WorkStuff item' },
      { status: 500 }
    )
  }
}
