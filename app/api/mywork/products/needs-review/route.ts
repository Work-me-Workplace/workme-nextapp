/**
 * API Route: GET /api/mywork/products/needs-review
 * 
 * Returns products that need review (not assigned to design work package, not archived)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const { firebaseId } = await verifyAuth(request)

    // 2. Get WorkMe to get companyUnit
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        companyUnit: true,
      },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    if (!workMe.companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Company unit not set' },
        { status: 400 }
      )
    }

    // 3. Fetch Digital Signage Products that need review
    // (not archived, no design packages assigned)
    const digitalSignage = await prisma.productDigitalSign.findMany({
      where: {
        companyUnit: workMe.companyUnit,
        createdByWorkMeId: workMe.id,
        archivedAt: null, // Not archived
        designPackages: {
          none: {}, // No design packages assigned
        },
      },
      include: {
        workforceAchievement: {
          include: {
            imageAsset: {
              select: {
                id: true,
                url: true,
                filename: true,
              },
            },
          },
        },
        workforce: true,
        companyNews: true,
        companyEvent: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Format products with preview data
    const products = digitalSignage.map(p => {
      let headline = `Digital Signage - ${p.signType}`
      let subhead: string | null = null
      let imageUrl: string | null = null

      if (p.workforceAchievement) {
        headline = p.workforceAchievement.headline
        subhead = p.workforceAchievement.subhead || null
        imageUrl = p.workforceAchievement.imageAsset?.url || null
      } else if (p.workforce) {
        headline = p.workforce.title
        subhead = p.workforce.summary || null
      } else if (p.companyNews) {
        headline = p.companyNews.headline
        subhead = p.companyNews.subheadline || null
      } else if (p.companyEvent) {
        headline = p.companyEvent.eventName
        subhead = p.companyEvent.description || null
      }

      return {
        id: p.id,
        type: 'digital_signage',
        signType: p.signType,
        headline,
        subhead,
        imageUrl,
        companyUnit: p.companyUnit,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error: any) {
    console.error('[API] Failed to fetch products needing review:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
