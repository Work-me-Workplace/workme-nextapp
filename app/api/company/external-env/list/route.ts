/**
 * GET /api/company/external-env/list
 * 
 * List all CompanyExternalEnv for the company
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Fetch external environments
    const externalEnvs = await prisma.companyExternalEnv.findMany({
      where: {
        companyId,
      },
      include: {
        newsArtifact: {
          select: {
            id: true,
            headline: true,
            sourceName: true,
            sourceUrl: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      externalEnvs,
      count: externalEnvs.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/external-env/list error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list external environments' },
      { status: 500 }
    )
  }
}
