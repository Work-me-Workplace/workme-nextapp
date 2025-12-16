/**
 * API Route: GET /api/mywork/products/list
 * 
 * Returns all work products for the authenticated user:
 * - Email Digest Products
 * - Digital Signage Products
 * - Flyer/Poster (if exists)
 * - Senior Leader Email (if exists)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('[API GET /api/mywork/products/list] Starting...')
    
    // 1. Verify authentication
    const { firebaseId } = await verifyAuth(request)
    console.log('[API GET /api/mywork/products/list] Auth verified, firebaseId:', firebaseId)

    // 2. Get WorkMe - only need the ID, hydrate everything by createdByWorkMeId
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
      },
    })

    if (!workMe) {
      console.error('[API GET /api/mywork/products/list] WorkMe not found for firebaseId:', firebaseId)
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    console.log('[API GET /api/mywork/products/list] WorkMe found, id:', workMe.id)

    // 3. Fetch Email Digest Products - use workMeId only
    const emailDigests = await prisma.workForceEnduringProdEmailDigest.findMany({
      where: {
        createdByWorkMeId: workMe.id,
      },
      include: {
        _count: {
          select: {
            editions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Fetch Digital Signage Products - use workMeId only, include related content
    const digitalSignage = await prisma.productDigitalSign.findMany({
      where: {
        createdByWorkMeId: workMe.id,
      },
      include: {
        workforce: true,
        workforceAchievement: true,
        companyNews: true,
        companyEvent: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Helper function to get display title from digital signage product
    function getDigitalSignageTitle(p: typeof digitalSignage[0]): string {
      switch (p.signType) {
        case 'WORKFORCE':
          return p.workforce?.title || 'Workforce Signage'
        case 'WORKFORCE_ACHIEVEMENT':
          return p.workforceAchievement?.headline || 'Workforce Achievement'
        case 'COMPANY_NEWS':
          return p.companyNews?.headline || 'Company News'
        case 'COMPANY_EVENT':
          return p.companyEvent?.eventName || 'Company Event'
        default:
          return 'Digital Signage'
      }
    }

    // 5. Fetch Senior Leader Email Products
    const seniorLeaderEmails = await prisma.productSeniorLeaderEmail.findMany({
      where: {
        createdByWorkMeId: workMe.id,
      },
      include: {
        content: {
          include: {
            companyEmployee: {
              select: {
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            topics: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 6. Format products with type information
    const products = [
      ...emailDigests.map(p => ({
        id: p.id,
        type: 'email_digest',
        title: p.title,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.createdAt.toISOString(),
        metadata: {
          editionsCount: p._count.editions,
        },
      })),
      ...digitalSignage.map(p => ({
        id: p.id,
        type: 'digital_signage',
        title: getDigitalSignageTitle(p),
        description: null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        metadata: {
          signType: p.signType,
        },
      })),
      ...seniorLeaderEmails.map(p => ({
        id: p.id,
        type: 'senior_leader_email',
        title: p.content?.title || null,
        description: null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        metadata: {
          topicsCount: p._count.topics,
          saidBy: p.content?.companyEmployee?.fullName || null,
        },
      })),
    ]

    console.log('[API GET /api/mywork/products/list] Success, returning', products.length, 'products')
    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error: any) {
    console.error('[API GET /api/mywork/products/list] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch work products',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
