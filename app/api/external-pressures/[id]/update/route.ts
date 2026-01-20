import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/external-pressures/[id]/update
 * Update an external company pressure
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id: pressureId } = await params

    // 3. Parse request body
    const body = await request.json()

    console.log('[API POST /api/external-pressures/[id]/update]', {
      workMeId,
      pressureId,
    })

    // 4. Verify pressure belongs to user
    const existingPressure = await prisma.externalCompanyPressure.findFirst({
      where: {
        id: pressureId,
        workMeId,
      },
    })

    if (!existingPressure) {
      return NextResponse.json(
        { success: false, error: 'Pressure not found' },
        { status: 404 },
      )
    }

    // 5. Build update data (only include provided fields)
    const updateData: any = {}
    
    if (body.source !== undefined) {
      if (typeof body.source !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Source must be a valid enum value' },
          { status: 400 },
        )
      }
      updateData.source = body.source as any
    }
    
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Title cannot be empty' },
          { status: 400 },
        )
      }
      updateData.title = body.title.trim()
    }
    
    if (body.summary !== undefined) {
      if (typeof body.summary !== 'string' || body.summary.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Summary cannot be empty' },
          { status: 400 },
        )
      }
      updateData.summary = body.summary.trim()
    }
    
    if (body.impact !== undefined) {
      updateData.impact = body.impact?.trim() || null
    }
    
    if (body.workforceConcern !== undefined) {
      if (typeof body.workforceConcern !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Workforce concern must be a valid enum value' },
          { status: 400 },
        )
      }
      updateData.workforceConcern = body.workforceConcern as any
    }
    
    if (body.levelOfSeverity !== undefined) {
      if (typeof body.levelOfSeverity !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Level of severity must be a number' },
          { status: 400 },
        )
      }
      if (body.levelOfSeverity < 0 || body.levelOfSeverity > 5) {
        return NextResponse.json(
          { success: false, error: 'Level of severity must be between 0 and 5' },
          { status: 400 },
        )
      }
      updateData.levelOfSeverity = body.levelOfSeverity
    }

    // 6. Update pressure
    const pressure = await prisma.externalCompanyPressure.update({
      where: {
        id: pressureId,
      },
      data: updateData,
    })

    console.log('[API POST /api/external-pressures/[id]/update] SUCCESS')

    return NextResponse.json({
      success: true,
      pressure,
    })
  } catch (error: any) {
    console.error('❌ POST /api/external-pressures/[id]/update error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update pressure',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

