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

    // 2. Get WorkMe to get companyUnit
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId },
      select: {
        id: true,
        companyUnit: true,
      },
    })

    if (!workMe) {
      console.error('[API GET /api/mywork/products/list] WorkMe not found for firebaseId:', firebaseId)
      return NextResponse.json(
        { success: false, error: 'WorkMe identity not found' },
        { status: 404 }
      )
    }

    console.log('[API GET /api/mywork/products/list] WorkMe found:', {
      id: workMe.id,
      companyUnit: workMe.companyUnit,
    })

    if (!workMe.companyUnit) {
      console.warn('[API GET /api/mywork/products/list] Company unit not set for workMe:', workMe.id)
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
