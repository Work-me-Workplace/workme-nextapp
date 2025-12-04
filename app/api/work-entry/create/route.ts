import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/work-entry/create
 * 
 * Create work entry (employment history)
 * Links WorkMe to CompanyUnit with employment details
 * 
 * Body: {
 *   companyUnitId: string,
 *   division?: string,
 *   title?: string,
 *   startDate?: string (ISO date),
 *   endDate?: string (ISO date) // null = current
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { companyUnitId, division, title, startDate, endDate } = body

    if (!companyUnitId) {
      return NextResponse.json(
        { success: false, error: 'companyUnitId is required' },
        { status: 400 },
      )
    }

    // Verify CompanyUnit exists
    const companyUnit = await prisma.companyUnit.findUnique({
      where: { id: companyUnitId },
    })

    if (!companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Company unit not found' },
        { status: 404 },
      )
    }

    // Create WorkEntry
    const workEntry = await prisma.workEntry.create({
      data: {
        userId: workMeId,
        companyUnitId,
        division: division?.trim() || null,
        title: title?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        companyUnit: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    })

    console.log('✅ WorkEntry created:', workEntry.id)

    return NextResponse.json({
      success: true,
      workEntry: {
        id: workEntry.id,
        userId: workEntry.userId,
        companyUnit: workEntry.companyUnit,
        division: workEntry.division,
        title: workEntry.title,
        startDate: workEntry.startDate,
        endDate: workEntry.endDate,
        createdAt: workEntry.createdAt,
        updatedAt: workEntry.updatedAt,
      },
    })
  } catch (error: any) {
    console.error('❌ WorkEntryCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create work entry' },
      { status: 500 },
    )
  }
}

