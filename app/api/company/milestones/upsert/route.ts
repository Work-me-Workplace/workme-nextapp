/**
 * POST /api/company/milestones/upsert
 * 
 * Save a CompanyMilestone after user confirmation
 * Takes preview data from parse endpoint and saves to database
 * 
 * CRITICAL: Only saves BIG PICTURE company-wide milestones
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
      newsArtifactId, 
      milestoneId,
      title,
      category,
      milestoneType,
      date,
      description,
      sourceUrl,
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'title is required' },
        { status: 400 }
      )
    }

    // If updating, verify milestone exists and belongs to company
    if (milestoneId) {
      const existing = await prisma.companyMilestone.findFirst({
        where: {
          id: milestoneId,
          companyId,
        },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Milestone not found or unauthorized' },
          { status: 404 }
        )
      }
    }

    // If newsArtifactId provided, verify it exists and belongs to company
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
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    console.log('[API POST /api/company/milestones/upsert]', {
      workMeId,
      companyId,
      newsArtifactId,
      milestoneId,
      title,
    })

    // Upsert the milestone
    let milestone
    if (milestoneId) {
      // Update existing milestone
      milestone = await prisma.companyMilestone.update({
        where: { id: milestoneId },
        data: {
          title,
          category: category || null,
          milestoneType: milestoneType || null,
          date: date ? new Date(date) : null,
          description: description || null,
          sourceUrl: sourceUrl || null,
          newsArtifactId: newsArtifactId || null,
          // CRITICAL: platformUnitId is optional - only for HUGE company-wide events involving a specific unit
          // Do NOT auto-create company milestones from unit updates - manual creation only
          platformUnitId: null, // Update endpoint doesn't accept platformUnitId - use create endpoint
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
        },
      })
    } else {
      // Create new milestone
      milestone = await prisma.companyMilestone.create({
        data: {
          companyId,
          title,
          category: category || null,
          milestoneType: milestoneType || null,
          date: date ? new Date(date) : null,
          description: description || null,
          sourceUrl: sourceUrl || null,
          newsArtifactId: newsArtifactId || null,
          // CRITICAL: platformUnitId is optional - only for HUGE company-wide events involving a specific unit
          // Do NOT auto-create company milestones from unit updates - manual creation only
          platformUnitId: null, // Upsert endpoint doesn't accept platformUnitId - use create endpoint
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
        },
      })
    }

    console.log(`✅ ${milestoneId ? 'Updated' : 'Created'} milestone ${milestone.id}`)

    return NextResponse.json({
      success: true,
      milestone: {
        id: milestone.id,
        title: milestone.title,
        category: milestone.category,
        milestoneType: milestone.milestoneType,
        date: milestone.date,
        description: milestone.description,
        sourceUrl: milestone.sourceUrl,
        newsArtifact: milestone.newsArtifact,
        platformUnit: milestone.platformUnit,
        createdAt: milestone.createdAt,
        updatedAt: milestone.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/milestones/upsert error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upsert milestone' },
      { status: 500 }
    )
  }
}

