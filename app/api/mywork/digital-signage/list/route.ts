/**
 * API Route: GET /api/mywork/digital-signage/list
 * 
 * Returns all digital signage products for the authenticated user
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

    // 3. Fetch Digital Signage Products
    const digitalSignage = await prisma.productDigitalSign.findMany({
      where: {
        companyUnit: workMe.companyUnit,
        createdByWorkMeId: workMe.id,
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
        signType: p.signType,
        companyUnit: p.companyUnit,
        headline,
        subhead,
        imageUrl,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error: any) {
    console.error('[API] Failed to list digital signage:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch digital signage' },
      { status: 500 }
    )
  }
}
