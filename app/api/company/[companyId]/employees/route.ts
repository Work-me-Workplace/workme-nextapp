import { NextRequest, NextResponse } from 'next/server'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/company/[companyId]/employees
 * 
 * Employee-first architecture: Get all employees for authenticated user's company.
 * 
 * Filters by companyId and workMeCompanyId only.
 * No unit filtering. No division filtering. No conversion lookup.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    // 1. Get WorkMe context
    const { companyId, workMeCompanyId } = await getWorkMeContext(request)

    // 2. Validate companyId matches authenticated user's company
    if (companyId !== params.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: companyId mismatch',
        },
        { status: 403 },
      )
    }

    if (!companyId || !workMeCompanyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User must belong to a company',
        },
        { status: 400 },
      )
    }

    // 3. Query employees by companyId and workMeCompanyId
    const employees = await prisma.companyEmployee.findMany({
      where: {
        companyId,
        workMeCompanyId,
      },
      include: {
        highlights: {
          include: {
            highlight: {
              select: {
                id: true,
                citationText: true,
                achievement: true,
                photoUrl: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    })

    console.log('[API GET /api/company/[companyId]/employees]', {
      companyId,
      workMeCompanyId,
      count: employees.length,
    })

    return NextResponse.json({
      success: true,
      employees,
    })
  } catch (error: any) {
    console.error('[API GET /api/company/[companyId]/employees] Error:', {
      error: error.message,
      stack: error.stack,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch employees',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

