/**
 * GET /api/company/milestones/list
 * 
 * List CompanyMilestones for the current company
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
    const { companyId } = workMe

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID not set' },
        { status: 401 }
      )
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const milestoneType = searchParams.get('milestoneType')

    // Build where clause
    // CRITICAL: CompanyMilestone is for BIG PICTURE company-wide milestones
    // platformUnitId is optional - only for huge company-wide events involving a specific unit
    // We show ALL company milestones (with or without platformUnitId)
    const where: any = {
      companyId,
    }

    if (category) {
      where.category = category
    }

    if (milestoneType) {
      where.milestoneType = milestoneType
    }

    // Fetch milestones
    const milestones = await prisma.companyMilestone.findMany({
      where,
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
            platformProduct: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      milestones,
      count: milestones.length,
    })
  } catch (error: any) {
    console.error('❌ GET /api/company/milestones/list error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

