/**
 * API Route: Single Email Digest Edition
 * GET - Get edition by ID with items
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

/**
 * GET /api/workforce/enduring/email-digest/[emailDigestId]/editions/[editionId]
 * Get email digest edition by ID with items
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ emailDigestId: string; editionId: string }> }
) {
  try {
    const { editionId } = await params
    
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId' },
        { status: 400 }
      )
    }

    const edition = await prisma.emailDigestEdition.findFirst({
      where: {
        id: editionId,
        companyId,
      },
      include: {
        product: true,
        editionItems: {
          include: {
            item: true, // Get the actual EmailDigestItem with formattedContent
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!edition) {
      return NextResponse.json(
        { success: false, error: 'Email digest edition not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, edition })
  } catch (error) {
    console.error('Error fetching email digest edition:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch email digest edition' },
      { status: 500 }
    )
  }
}

