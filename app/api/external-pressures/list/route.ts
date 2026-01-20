import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/external-pressures/list
 * List all external company pressures for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    console.log('[API GET /api/external-pressures/list]', {
      workMeId,
    })

    const pressures = await prisma.externalCompanyPressure.findMany({
      where: {
        workMeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        source: true,
        title: true,
        summary: true,
        impact: true,
        workforceConcern: true,
        levelOfSeverity: true,
        createdAt: true,
      },
    })

    console.log('[API GET /api/external-pressures/list] SUCCESS', {
      count: pressures.length,
    })

    return NextResponse.json({
      success: true,
      pressures,
    })
  } catch (error: any) {
    console.error('❌ GET /api/external-pressures/list error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to list pressures',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status },
    )
  }
}

