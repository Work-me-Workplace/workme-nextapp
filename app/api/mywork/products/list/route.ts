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

    // 3. Fetch Email Digest Products
    const emailDigests = await prisma.workForceEnduringProdEmailDigest.findMany({
      where: {
        companyUnit: workMe.companyUnit,
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

    // 4. Fetch Digital Signage Products
    const digitalSignage = await prisma.productDigitalSign.findMany({
      where: {
        companyUnit: workMe.companyUnit,
        createdByWorkMeId: workMe.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 5. Format products with type information
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
        title: `Digital Signage - ${p.signType}`,
        description: null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        metadata: {
          signType: p.signType,
        },
      })),
    ]

    return NextResponse.json({
      success: true,
      products,
    })
  } catch (error: any) {
    console.error('[API] Failed to list work products:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch work products' },
      { status: 500 }
    )
  }
}
