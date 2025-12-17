/**
 * POST /api/utils/news-artifact/create
 * 
 * Create a CompanyNewsArtifact from URL or text
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      sourceUrl, 
      sourceName, 
      headline, 
      rawText,
      aiSummary,
      artifactType,
      sentiment,
      humanElements,
      noteworthyItems,
      leaderStatement,
    } = body

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/utils/news-artifact/create]', {
      workMeId,
      companyId,
      hasUrl: !!sourceUrl,
      hasHeadline: !!headline,
      artifactType,
      sentiment,
    })

    // Create CompanyNewsArtifact with full intelligence
    const artifact = await prisma.companyNewsArtifact.create({
      data: {
        companyId,
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        headline: headline || null,
        rawText: rawText.trim(),
        aiSummary: aiSummary || null,
        artifactType: artifactType || null,
        sentiment: sentiment || null,
        humanElements: humanElements || null,
        noteworthyItems: noteworthyItems || null,
        leaderStatement: leaderStatement || null,
        createdByWorkMeId: workMeId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: artifact.id,
        sourceUrl: artifact.sourceUrl,
        sourceName: artifact.sourceName,
        headline: artifact.headline,
        rawText: artifact.rawText,
        createdAt: artifact.createdAt,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/utils/news-artifact/create error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create news artifact' },
      { status: 500 }
    )
  }
}
