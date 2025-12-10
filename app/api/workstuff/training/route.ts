/**
 * WorkStuff Training API
 * 
 * GET /api/workstuff/training - List all trainings
 * POST /api/workstuff/training - Create new training
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { createCompanyXWithIngest } from '@/lib/services/companyx-mapper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireWorkMeAuth(request)

    const { searchParams } = new URL(request.url)
    const companyUnitId = searchParams.get('companyUnitId')

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId query parameter is required' },
        { status: 400 }
      )
    }

    const trainings = await prisma.companyTraining.findMany({
      where: { companyUnit: companyUnitId },
      orderBy: { trainingDate: 'asc' },
    })

    return NextResponse.json({
      success: true,
      trainings,
    })
  } catch (error: any) {
    console.error('[WorkStuff Training GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trainings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const workMe = await requireWorkMeAuth(request)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { companyUnitId, data, rawText } = body

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 }
      )
    }

    // If rawText provided, use ingest flow
    if (rawText) {
      const result = await createCompanyXWithIngest(
        prisma,
        'training',
        rawText,
        workMeId,
        companyUnitId
      )

      return NextResponse.json({
        success: true,
        id: result.id,
        training: result.record,
      })
    }

    // Otherwise create with provided data
    const training = await prisma.companyTraining.create({
      data: {
        ...data,
        companyUnit: companyUnitId,
        createdByWorkMeId: workMeId,
      },
    })

    return NextResponse.json({
      success: true,
      id: training.id,
      training,
    })
  } catch (error: any) {
    console.error('[WorkStuff Training POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create training' },
      { status: 500 }
    )
  }
}
