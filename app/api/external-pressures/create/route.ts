import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/external-pressures/create
 * Create a new external company pressure
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Parse request body
    const body = await request.json()
    const { source, title, summary, impact, workforceConcern, levelOfSeverity } = body

    // 4. Validate required fields
    if (!source || typeof source !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Source is required and must be a valid enum value' },
        { status: 400 },
      )
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 },
      )
    }

    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Summary is required' },
        { status: 400 },
      )
    }

    if (!workforceConcern || typeof workforceConcern !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Workforce concern is required and must be a valid enum value' },
        { status: 400 },
      )
    }

    if (levelOfSeverity === undefined || levelOfSeverity === null || typeof levelOfSeverity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Level of severity is required and must be a number (0-5)' },
        { status: 400 },
      )
    }

    if (levelOfSeverity < 0 || levelOfSeverity > 5) {
      return NextResponse.json(
        { success: false, error: 'Level of severity must be between 0 and 5' },
        { status: 400 },
      )
    }

    console.log('[API POST /api/external-pressures/create]', {
      workMeId,
      source,
      title,
      workforceConcern,
      levelOfSeverity,
    })

    // 5. Create pressure
    const pressure = await prisma.externalCompanyPressure.create({
      data: {
        workMeId,
        source: source as any, // Prisma enum
        title: title.trim(),
        summary: summary.trim(),
        impact: impact?.trim() || null,
        workforceConcern: workforceConcern as any, // Prisma enum
        levelOfSeverity,
      },
    })

    console.log('[API POST /api/external-pressures/create] SUCCESS', {
      pressureId: pressure.id,
    })

    return NextResponse.json({
      success: true,
      pressure,
    })
  } catch (error: any) {
    console.error('❌ POST /api/external-pressures/create error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create pressure',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

