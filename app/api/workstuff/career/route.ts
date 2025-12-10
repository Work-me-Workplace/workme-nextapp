/**
 * WorkStuff Career API
 * 
 * GET /api/workstuff/career - List all careers
 * POST /api/workstuff/career - Create new career
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

    const careers = await prisma.companyCareer.findMany({
      where: { companyUnit: companyUnitId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      careers,
    })
  } catch (error: any) {
    console.error('[WorkStuff Career GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch careers' },
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
        'career',
        rawText,
        workMeId,
        companyUnitId
      )

      return NextResponse.json({
        success: true,
        id: result.id,
        career: result.record,
      })
    }

    // Otherwise create with provided data
    const career = await prisma.companyCareer.create({
      data: {
        ...data,
        companyUnit: companyUnitId,
        createdByWorkMeId: workMeId,
      },
    })

    return NextResponse.json({
      success: true,
      id: career.id,
      career,
    })
  } catch (error: any) {
    console.error('[WorkStuff Career POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create career' },
      { status: 500 }
    )
  }
}
