/**
 * GET /api/utils/news-artifact/list
 * 
 * List all CompanyNewsArtifacts for the company
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

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const sourceName = searchParams.get('sourceName')
    const artifactType = searchParams.get('artifactType')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100

    // Build where clause
    const where: any = {
      companyId,
    }

    if (sourceName) {
      where.sourceName = sourceName
    }

    if (artifactType) {
      where.artifactType = artifactType
    }

    // Fetch news artifacts
    const artifacts = await prisma.companyNewsArtifact.findMany({
      where,
      select: {
        id: true,
        headline: true,
        sourceName: true,
        sourceUrl: true,
        rawText: true,
        aiSummary: true,
        artifactType: true,
        sentiment: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            milestones: true,
            externalEnv: true,
            platformStatements: true,
            platformUnitStatements: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      artifacts,
      count: artifacts.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/utils/news-artifact/list error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list news artifacts' },
      { status: 500 }
    )
  }
}
