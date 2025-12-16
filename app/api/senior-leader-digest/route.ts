import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/senior-leader-digest
 * Creates a new weekly digest container
 * 
 * Responsibilities:
 * - Accept leader name, role, week
 * - Create empty digest
 * - Return digestId
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
    const { leaderName, leaderRole, organizationId, weekOf } = body

    // 4. Validate required fields
    if (!leaderName || typeof leaderName !== 'string' || leaderName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'leaderName is required' },
        { status: 400 },
      )
    }

    if (!leaderRole || typeof leaderRole !== 'string' || leaderRole.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'leaderRole is required' },
        { status: 400 },
      )
    }

    if (!organizationId || typeof organizationId !== 'string' || organizationId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400 },
      )
    }

    if (!weekOf) {
      return NextResponse.json(
        { success: false, error: 'weekOf is required' },
        { status: 400 },
      )
    }

    // Parse weekOf date
    const weekOfDate = new Date(weekOf)
    if (isNaN(weekOfDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'weekOf must be a valid date' },
        { status: 400 },
      )
    }

    console.log('[API POST /api/senior-leader-digest]', {
      workMeId,
      leaderName,
      leaderRole,
      organizationId,
      weekOf: weekOfDate,
    })

    // 5. Create digest
    const digest = await prisma.seniorLeaderDigest.create({
      data: {
        leaderName: leaderName.trim(),
        leaderRole: leaderRole.trim(),
        organizationId: organizationId.trim(),
        weekOf: weekOfDate,
        status: 'DRAFT',
      },
    })

    console.log('[API POST /api/senior-leader-digest] SUCCESS', {
      digestId: digest.id,
    })

    return NextResponse.json({
      success: true,
      digestId: digest.id,
      digest,
    })
  } catch (error: any) {
    console.error('❌ POST /api/senior-leader-digest error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create digest',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}
