/**
 * API Route: Single Email Digest Product
 * GET - Get email digest product by ID
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

/**
 * GET /api/workforce/enduring/email-digest/[emailDigestId]
 * Get email digest product by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ emailDigestId: string }> }
) {
  try {
    const { emailDigestId } = await params
    
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId' },
        { status: 400 }
      )
    }

    const product = await prisma.workForceEnduringProdEmailDigest.findFirst({
      where: {
        id: emailDigestId,
        companyId,
      },
      include: {
        editions: {
          orderBy: { generatedAt: 'desc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Email digest product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Error fetching email digest product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email digest product' },
      { status: 500 }
    )
  }
}
