/**
 * POST /api/company/external-env/create
 * Create a new CompanyExternalEnv record
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
      source,
      category,
      summary,
      impact,
      platformUnitId,
      platformProductId,
      newsArtifactId,
      milestoneId,
    } = body

    // Validate required fields
    if (!source || typeof source !== 'string' || source.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Source is required' },
        { status: 400 }
      )
    }

    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Summary is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/company/external-env/create]', {
      workMeId,
      companyId,
      source,
      category,
      hasPlatformUnitId: !!platformUnitId,
      hasPlatformProductId: !!platformProductId,
      hasNewsArtifactId: !!newsArtifactId,
    })

    // Validate optional foreign keys if provided
    if (platformUnitId) {
      const unit = await prisma.companyPlatformUnit.findUnique({
        where: { id: platformUnitId },
      })
      if (!unit) {
        return NextResponse.json(
          { success: false, error: 'Platform unit not found' },
          { status: 404 }
        )
      }
    }

    if (platformProductId) {
      const product = await prisma.companyPlatformProduct.findUnique({
        where: { id: platformProductId },
      })
      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Platform product not found' },
          { status: 404 }
        )
      }
    }

    if (newsArtifactId) {
      const artifact = await prisma.companyNewsArtifact.findUnique({
        where: { id: newsArtifactId },
      })
      if (!artifact) {
        return NextResponse.json(
          { success: false, error: 'News artifact not found' },
          { status: 404 }
        )
      }
      if (artifact.companyId !== companyId) {
        return NextResponse.json(
          { success: false, error: 'News artifact does not belong to your company' },
          { status: 403 }
        )
      }
    }

    if (milestoneId) {
      const milestone = await prisma.companyMilestone.findUnique({
        where: { id: milestoneId },
      })
      if (!milestone) {
        return NextResponse.json(
          { success: false, error: 'Milestone not found' },
          { status: 404 }
        )
      }
      if (milestone.companyId !== companyId) {
        return NextResponse.json(
          { success: false, error: 'Milestone does not belong to your company' },
          { status: 403 }
        )
      }
    }

    // Create CompanyExternalEnv
    const externalEnv = await prisma.companyExternalEnv.create({
      data: {
        companyId,
        workMeId,
        source: source.trim(),
        category: category?.trim() || null,
        summary: summary.trim(),
        impact: impact?.trim() || null,
        deltaSummary: body.deltaSummary?.trim() || null,
        implementationTimeline: body.implementationTimeline?.trim() || null,
        leadAuthority: body.leadAuthority?.trim() || null,
        confidenceLevel: body.confidenceLevel || null,
        timeHorizon: body.timeHorizon || null,
        platformUnitId: platformUnitId || null,
        platformProductId: platformProductId || null,
        newsArtifactId: newsArtifactId || null,
        milestoneId: milestoneId || null,
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
        milestone: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    console.log('[API POST /api/company/external-env/create] SUCCESS', {
      externalEnvId: externalEnv.id,
    })

    return NextResponse.json({
      success: true,
      data: externalEnv,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/external-env/create error:', error)

    const status = error.message?.includes('Unauthorized') ? 401 : 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create external environment item',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status }
    )
  }
}

