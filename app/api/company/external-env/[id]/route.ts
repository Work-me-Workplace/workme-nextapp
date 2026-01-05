/**
 * GET /api/company/external-env/[id]
 * 
 * Get a CompanyExternalEnv by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get external env
    const externalEnv = await prisma.companyExternalEnv.findUnique({
      where: { id },
      include: {
        newsArtifact: {
          select: {
            id: true,
            headline: true,
            sourceName: true,
            sourceUrl: true,
            rawText: true,
          },
        },
        platformUnit: {
          select: {
            id: true,
            name: true,
            hullNumber: true,
          },
        },
        platformProduct: {
          select: {
            id: true,
            name: true,
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    if (!externalEnv) {
      return NextResponse.json(
        { success: false, error: 'External environment not found' },
        { status: 404 }
      )
    }

    // Verify it belongs to the user's company
    if (externalEnv.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: externalEnv,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/external-env/[id] error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get external environment' },
      { status: 500 }
    )
  }
}
