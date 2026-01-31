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
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const artifactType = searchParams.get('artifactType')
    const sentiment = searchParams.get('sentiment')

    // Build where clause
    const where: any = {
      companyId,
    }

    if (artifactType) {
      where.artifactType = artifactType
    }

    if (sentiment) {
      where.sentiment = sentiment
    }

    // Get all artifacts for company
    const [artifacts, total] = await Promise.all([
      prisma.companyNewsArtifact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          sourceName: true,
          sourceUrl: true,
          headline: true,
          rawText: true,
          aiSummary: true,
          artifactType: true,
          sentiment: true,
          createdAt: true,
          // Check if already linked to unit statements
          platformUnitStatements: {
            select: {
              id: true,
              platformUnitId: true,
              platformUnit: {
                select: {
                  id: true,
                  hullNumber: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.companyNewsArtifact.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        artifacts,
        total,
        limit,
        offset,
      },
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/articles/list error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list articles' },
      { status: 500 }
    )
  }
}
