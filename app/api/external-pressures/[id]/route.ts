import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/external-pressures/[id]
 * Get an external company pressure by ID
 */
export async function GET(
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

    console.log('[API GET /api/external-pressures/[id]]', {
      workMeId,
      pressureId,
    })

    // 3. Find pressure (must belong to user)
    const pressure = await prisma.externalCompanyPressure.findFirst({
      where: {
        id: pressureId,
        workMeId,
      },
    })

    if (!pressure) {
      return NextResponse.json(
        { success: false, error: 'Pressure not found' },
        { status: 404 },
      )
    }

    console.log('[API GET /api/external-pressures/[id]] SUCCESS')

    return NextResponse.json({
      success: true,
      pressure,
    })
  } catch (error: any) {
    console.error('❌ GET /api/external-pressures/[id] error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get pressure',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

