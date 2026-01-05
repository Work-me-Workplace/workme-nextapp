/**
 * API Route: Email Digest Editions
 * POST - Create new edition (DRAFT status)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'

// Schema for creating email digest edition (DRAFT)
const createEmailDigestEditionSchema = z.object({
  emailDigestId: z.string().uuid(),
})

/**
 * POST /api/workforce/enduring/email-digest/[emailDigestId]/editions
 * Create new edition in DRAFT status
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ emailDigestId: string }> }
) {
  try {
    const { emailDigestId } = await params
    const validated = createEmailDigestEditionSchema.parse({ emailDigestId })
    
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or user must set a companyId' },
        { status: 400 }
      )
    }

    // Verify product exists and belongs to user's company
    const product = await prisma.workForceEnduringProdEmailDigest.findFirst({
      where: {
        id: validated.emailDigestId,
        companyId,
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Email digest product not found' },
        { status: 404 }
      )
    }

    // Create empty edition in DRAFT status
    const edition = await prisma.emailDigestEdition.create({
      data: {
        emailDigestId: validated.emailDigestId,
        status: 'DRAFT',
        // contentJson omitted - will be null by default until generated
        originatorId: workMeId,
        companyId,
      },
    })

    return NextResponse.json({ success: true, edition })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating email digest edition:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create email digest edition' },
      { status: 500 }
    )
  }
}

