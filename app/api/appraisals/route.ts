import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/appraisals
 * List appraisals for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const appraisals = await prisma.appraisal.findMany({
      where: { workMeId },
      orderBy: { periodStart: 'desc' },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { objectives: true } },
      },
    })

    return NextResponse.json({
      success: true,
      appraisals: appraisals || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get appraisals'
    console.error('❌ GetAppraisals error:', error)
    return NextResponse.json(
      { success: false, error: message, appraisals: [] },
      { status: 500 },
    )
  }
}

/**
 * POST /api/appraisals
 * Create an appraisal
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { periodStart, periodEnd, title } = body

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, error: 'periodStart and periodEnd are required' },
        { status: 400 },
      )
    }

    const appraisal = await prisma.appraisal.create({
      data: {
        workMeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        title: title?.trim() || null,
      },
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      appraisal,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create appraisal'
    console.error('❌ CreateAppraisal error:', error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
