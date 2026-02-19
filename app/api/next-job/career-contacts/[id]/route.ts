import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/next-job/career-contacts/[id]
 * Get one career contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    const contact = await prisma.careerContact.findFirst({
      where: { id, workMeId },
      include: {
        targetJob: true,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Career contact not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      careerContact: contact,
    })
  } catch (error: any) {
    console.error('❌ Get career contact error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get career contact' },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/next-job/career-contacts/[id]
 * Update a career contact
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.careerContact.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Career contact not found' },
        { status: 404 },
      )
    }

    const data: Record<string, unknown> = {}
    const allowed = [
      'targetJobId',
      'name',
      'email',
      'companyName',
      'roleInProcess',
      'notes',
      'lastContactAt',
      'nextAction',
    ]
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'lastContactAt') {
          data[key] = body[key] ? new Date(body[key]) : null
        } else if (key === 'targetJobId') {
          data[key] = body[key] ?? null
        } else if (typeof body[key] === 'string') {
          data[key] = body[key].trim()
        } else {
          data[key] = body[key]
        }
      }
    }

    const contact = await prisma.careerContact.update({
      where: { id },
      data,
      include: {
        targetJob: { select: { id: true, jobTitle: true, companyName: true } },
      },
    })

    return NextResponse.json({
      success: true,
      careerContact: contact,
    })
  } catch (error: any) {
    console.error('❌ Update career contact error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update career contact' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/next-job/career-contacts/[id]
 * Delete a career contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { id } = await params

    const existing = await prisma.careerContact.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Career contact not found' },
        { status: 404 },
      )
    }

    await prisma.careerContact.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Career contact deleted',
    })
  } catch (error: any) {
    console.error('❌ Delete career contact error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete career contact' },
      { status: 500 },
    )
  }
}
