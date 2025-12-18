/**
 * API Route: Email Digest Products
 * POST - Create new email digest product
 * GET - List all email digest products
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Schema for creating email digest product
const createEmailDigestProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
})

/**
 * POST /api/workforce/enduring/email-digest
 * Create new email digest product
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = createEmailDigestProductSchema.parse(body)
    
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId' },
        { status: 400 }
      )
    }

    const product = await prisma.workForceEnduringProdEmailDigest.create({
      data: {
        title: validated.title,
        description: validated.description ?? undefined,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return NextResponse.json({ success: true, product })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating email digest product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create email digest product' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workforce/enduring/email-digest
 * Get all email digest products for current user
 */
export async function GET(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId', products: [] },
        { status: 400 }
      )
    }

    const products = await prisma.workForceEnduringProdEmailDigest.findMany({
      where: {
        companyId,
      },
      include: {
        editions: {
          orderBy: { generatedAt: 'desc' },
          take: 1, // Get latest edition for preview
        },
        _count: {
          select: {
            editions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Error fetching email digest products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email digest products', products: [] },
      { status: 500 }
    )
  }
}
