/**
 * WorkStuff Cause API (Employee Cause)
 * 
 * GET /api/workstuff/cause - List all employee causes
 * POST /api/workstuff/cause - Create new cause
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

    const causes = await prisma.companyEmployeeCause.findMany({
      where: { companyUnit: companyUnitId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      causes,
    })
  } catch (error: any) {
    console.error('[WorkStuff Cause GET] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch causes' },
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
        'employee_cause',
        rawText,
        workMeId,
        companyUnitId
      )

      return NextResponse.json({
        success: true,
        id: result.id,
        cause: result.record,
      })
    }

    // Otherwise create with provided data
    const cause = await prisma.companyEmployeeCause.create({
      data: {
        ...data,
        companyUnit: companyUnitId,
      },
    })

    return NextResponse.json({
      success: true,
      id: cause.id,
      cause,
    })
  } catch (error: any) {
    console.error('[WorkStuff Cause POST] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create cause' },
      { status: 500 }
    )
  }
}
