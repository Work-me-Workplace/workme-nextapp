/**
 * API Route: GET /api/mywork/active/list
 * 
 * Returns all active work items (not archived) including digital signage
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

    // 3. Fetch active Digital Signage Products
    const digitalSignage = await prisma.productDigitalSign.findMany({
      where: {
        companyUnit: workMe.companyUnit,
        createdByWorkMeId: workMe.id,
      },
      include: {
        workforceAchievement: {
          select: {
            headline: true,
            subhead: true,
          },
        },
        workforce: {
          select: {
            title: true,
          },
        },
        companyNews: {
          select: {
            headline: true,
          },
        },
        companyEvent: {
          select: {
            eventName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Format as active work items
    const activeItems = digitalSignage.map(p => {
      let title = `Digital Signage - ${p.signType}`
      
      if (p.workforceAchievement) {
        title = p.workforceAchievement.headline
      } else if (p.workforce) {
        title = p.workforce.title
      } else if (p.companyNews) {
        title = p.companyNews.headline
      } else if (p.companyEvent) {
        title = p.companyEvent.eventName
      }

      return {
        id: p.id,
        type: 'digital_signage',
        title,
        outputType: 'digital_signage',
        status: 'active',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        viewPath: `/mywork/digital-signage/${p.id}`,
      }
    })

    // TODO: Add other work product types (email digests, etc.)

    return NextResponse.json({
      success: true,
      items: activeItems,
    })
  } catch (error: any) {
    console.error('[API] Failed to list active work:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch active work' },
      { status: 500 }
    )
  }
}
