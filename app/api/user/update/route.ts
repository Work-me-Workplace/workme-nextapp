import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/user/update
 * 
 * ⚠️ DEPRECATED: This route is deprecated. Use /api/work-entry/create instead.
 * 
 * Legacy route for updating companyUnit and companyDivision.
 * Now redirects to new WorkEntry pattern.
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe
    const body = await request.json()
    const { companyUnit, companyDivision } = body

    if (!companyUnit || typeof companyUnit !== 'string' || !companyUnit.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyUnit is required' },
        { status: 400 }
      )
    }

    // New architecture: Use CompanyUnit registry + WorkEntry
    // 1. Search or create CompanyUnit
    const normalizedName = companyUnit.trim()
    let companyUnitRecord = await prisma.companyUnit.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    })

    if (!companyUnitRecord) {
      companyUnitRecord = await prisma.companyUnit.create({
        data: {
          name: normalizedName,
        },
      })
    }

    // 2. Create or update WorkEntry (end current entry if exists, create new)
    // End any current work entries
    await prisma.workEntry.updateMany({
      where: {
        userId: workMeId,
        endDate: null, // Current job
      },
      data: {
        endDate: new Date(), // End current job
      },
    })

    // Create new WorkEntry
    const workEntry = await prisma.workEntry.create({
      data: {
        userId: workMeId,
        companyUnitId: companyUnitRecord.id,
        division: companyDivision?.trim() || null,
        startDate: new Date(),
        endDate: null, // Current job
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

    console.log('[API POST /api/user/update] SUCCESS (migrated to WorkEntry)', {
      workMeId,
      workEntryId: workEntry.id,
      companyUnit: companyUnitRecord.name,
      division: workEntry.division,
    })

    return NextResponse.json({
      success: true,
      message: 'Migrated to new WorkEntry pattern',
      workEntry: {
        id: workEntry.id,
        companyUnit: workEntry.companyUnit,
        division: workEntry.division,
        startDate: workEntry.startDate,
        endDate: workEntry.endDate,
      },
    })
  } catch (error: any) {
    console.error('[API POST /api/user/update] ERROR:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update user' 
      },
      { status: 500 }
    )
  }
}

