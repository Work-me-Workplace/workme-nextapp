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
    console.log('[API GET /api/mywork/active/list] Starting...')
    
    // 1. Verify authentication
    const { firebaseId } = await verifyAuth(request)
    console.log('[API GET /api/mywork/active/list] Auth verified, firebaseId:', firebaseId)

    // 2. Get WorkMe - only need the ID, hydrate everything by createdByWorkMeId
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
      },
    })

    if (!workMe) {
      console.error('[API GET /api/mywork/active/list] WorkMe not found for firebaseId:', firebaseId)
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    console.log('[API GET /api/mywork/active/list] WorkMe found, id:', workMe.id)

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
        },
        orderBy: { createdAt: 'desc' },
      }),

      // CommsOutput (work outputs)
      prisma.commsOutput.findMany({
        where: {
          originatorId: workMe.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
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
        updatedAt: p.createdAt.toISOString(), // Use createdAt since updatedAt doesn't exist
        viewPath: `/workforce/enduring/email-digest/${p.id}`,
      })),

      // Work Outputs (CommsOutput)
      ...workOutputs.map(p => ({
        id: p.id,
        type: p.type,
        title: p.title,
        outputType: p.type,
        status: 'active',
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt?.toISOString() || p.createdAt.toISOString(),
        viewPath: `/mywork/outputs/${p.id}`,
      })),
    ]

    // Sort by creation date (newest first)
    activeItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    console.log('[API GET /api/mywork/active/list] Success, returning', activeItems.length, 'items:', {
      digitalSignage: activeItems.filter(i => i.type === 'digital_signage').length,
      emailDigests: activeItems.filter(i => i.type === 'email_digest').length,
      workOutputs: activeItems.filter(i => i.type !== 'digital_signage' && i.type !== 'email_digest').length,
    })

    return NextResponse.json({
      success: true,
      items: activeItems,
    })
  } catch (error: any) {
    console.error('[API GET /api/mywork/active/list] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch active work',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
