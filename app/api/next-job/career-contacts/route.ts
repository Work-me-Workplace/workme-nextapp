import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/next-job/career-contacts
 * List career contacts for current user. Optional ?targetJobId= to filter by job.
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { searchParams } = new URL(request.url)
    const targetJobId = searchParams.get('targetJobId') ?? undefined

    const where: { workMeId: string; targetJobId?: string } = { workMeId }
    if (targetJobId) {
      where.targetJobId = targetJobId
    }

    const contacts = await prisma.careerContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        targetJob: {
          select: { id: true, jobTitle: true, companyName: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      careerContacts: contacts ?? [],
    })
  } catch (error: any) {
    console.error('❌ Get career contacts error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get career contacts', careerContacts: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/next-job/career-contacts
 * Create a career contact
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const {
      targetJobId,
      name,
      email,
      companyName,
      roleInProcess,
      notes,
      lastContactAt,
      nextAction,
    } = body

    if (targetJobId) {
      const job = await prisma.targetJob.findFirst({
        where: { id: targetJobId, workMeId },
      })
      if (!job) {
        return NextResponse.json(
          { success: false, error: 'Target job not found or access denied' },
          { status: 404 },
        )
      }
    }

    const contact = await prisma.careerContact.create({
      data: {
        workMeId,
        targetJobId: targetJobId ?? null,
        name: name ?? null,
        email: email ?? null,
        companyName: companyName ?? null,
        roleInProcess: roleInProcess ?? null,
        notes: notes ?? null,
        lastContactAt: lastContactAt ? new Date(lastContactAt) : null,
        nextAction: nextAction ?? null,
      },
      include: {
        targetJob: {
          select: { id: true, jobTitle: true, companyName: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      careerContact: contact,
    })
  } catch (error: any) {
    console.error('❌ Create career contact error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create career contact' },
      { status: 500 },
    )
  }
}
