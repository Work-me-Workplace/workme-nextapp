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
    // Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    
    // Load WorkMe identity (includes companyId)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    // CRITICAL: Ensure companyId is set - required for company-scoped artifacts
    if (!workMeId) {
      console.error('[API POST /api/utils/news-artifact/create] Missing workMeId', { firebaseId })
      return NextResponse.json(
        { success: false, error: 'Not authenticated - WorkMe ID not found' },
        { status: 401 }
      )
    }

    if (!companyId) {
      console.error('[API POST /api/utils/news-artifact/create] Missing companyId', { 
        workMeId, 
        firebaseId,
        workMeEmail: workMe.email 
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Company ID not set on your account. Please contact support to set your company.' 
        },
        { status: 400 }
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
      categoryId,
    } = body

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/utils/news-artifact/create] Creating artifact', {
      workMeId,
      companyId,
      hasUrl: !!sourceUrl,
      hasHeadline: !!headline,
      artifactType,
      sentiment,
      categoryId,
      rawTextLength: rawText.trim().length,
    })

    // CRITICAL: Ensure companyId is set before creating artifact
    if (!companyId) {
      throw new Error('CompanyId is required but was not set')
    }

    // If categoryId is provided, verify it belongs to the company
    if (categoryId) {
      const category = await prisma.articleCategory.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        )
      }

      if (category.companyId !== companyId) {
        return NextResponse.json(
          { success: false, error: 'Category does not belong to your company' },
          { status: 403 }
        )
      }
    }

    // Create CompanyNewsArtifact with full intelligence
    // companyId is REQUIRED - ensures artifact is scoped to correct company
    const artifact = await prisma.companyNewsArtifact.create({
      data: {
        companyId, // REQUIRED - from authenticated user's WorkMe record
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
        categoryId: categoryId || null,
        createdByWorkMeId: workMeId,
      },
    })

    console.log('[API POST /api/utils/news-artifact/create] SUCCESS', {
      artifactId: artifact.id,
      companyId: artifact.companyId,
      headline: artifact.headline,
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
