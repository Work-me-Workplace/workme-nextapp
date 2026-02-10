import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity to get companyId (source of truth)
    const workMe = await loadWorkMe(firebaseId)
    const { companyId } = workMe
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set on your account. Please contact support.' },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const artifactType = searchParams.get('artifactType')
    const sentiment = searchParams.get('sentiment')
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    if (categoryId) {
      where.categoryId = categoryId
    }

    console.log('[API GET /api/utils/news-artifact/list] Querying with:', {
      workMeId: workMe.id,
      companyId,
      artifactType,
      sentiment,
      limit,
      offset,
      whereClause: where,
    })

    // Get all artifacts for company
    const artifacts = await prisma.companyNewsArtifact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        headline: true,
        sourceName: true,
        sourceUrl: true,
        artifactType: true,
        sentiment: true,
        aiSummary: true,
        rawText: true, // Include for parsing
        createdAt: true,
        humanElements: true,
        noteworthyItems: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
        },
      },
    })

    const total = await prisma.companyNewsArtifact.count({ where })

    // Debug: Check if there are any artifacts with different companyIds
    const allArtifactsCount = await prisma.companyNewsArtifact.count({})
    const matchingCompanyIdCount = await prisma.companyNewsArtifact.count({ 
      where: { companyId } 
    })

    console.log('[API GET /api/utils/news-artifact/list] Found:', {
      artifactsCount: artifacts.length,
      total,
      allArtifactsInDB: allArtifactsCount,
      artifactsWithMatchingCompanyId: matchingCompanyIdCount,
      queriedCompanyId: companyId,
      sampleArtifactIds: artifacts.slice(0, 3).map(a => ({ 
        id: a.id, 
        headline: a.headline?.substring(0, 50),
      })),
    })

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
    console.error('❌ GET /api/utils/news-artifact/list error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list artifacts' },
      { status: 500 }
    )
  }
}
