/**
 * API Route: GET /api/mywork/active/list
 * 
 * Returns ALL work items created by the authenticated user (workMeId)
 * Includes: Digital Signage, Email Digests, WorkOutputStandalone, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication
    const { firebaseId } = await verifyAuth(request)

    // 2. Get WorkMe - only need the ID, hydrate everything by createdByWorkMeId
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
      },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    // 3. Fetch ALL products created by this workMeId
    const [
      digitalSignage,
      emailDigests,
      workOutputs,
    ] = await Promise.all([
      // Digital Signage Products
      prisma.productDigitalSign.findMany({
        where: {
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
      }),

      // Email Digest Products
      prisma.workForceEnduringProdEmailDigest.findMany({
        where: {
          createdByWorkMeId: workMe.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Work Output Standalone
      prisma.workOutputStandalone.findMany({
        where: {
          createdByWorkMeId: workMe.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          outputType: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // 4. Format all items as active work items
    const activeItems = [
      // Digital Signage
      ...digitalSignage.map(p => {
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
          status: p.archivedAt ? 'archived' : 'active',
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          viewPath: `/mywork/digital-signage/${p.id}`,
        }
      }),

      // Email Digests
      ...emailDigests.map(p => ({
        id: p.id,
        type: 'email_digest',
        title: p.title,
        outputType: 'email_digest',
        status: 'active',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        viewPath: `/workforce/enduring/email-digest/${p.id}`,
      })),

      // Work Outputs
      ...workOutputs.map(p => ({
        id: p.id,
        type: p.outputType,
        title: p.title,
        outputType: p.outputType,
        status: 'active',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        viewPath: `/mywork/outputs/${p.id}`,
      })),
    ]

    // Sort by creation date (newest first)
    activeItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

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
