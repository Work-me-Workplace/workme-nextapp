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
        workMeId: workMeId,
        endDate: null, // Current job
      },
      data: {
        endDate: new Date(), // End current job
      },
    }).catch((err: any) => {
      if (err.code === 'P2021') {
        // Table doesn't exist yet, skip
        return
      }
      throw err
    })

    // Create new WorkEntry (WorkEntry uses companyName string, not companyUnitId)
    const workEntry = await prisma.workEntry.create({
      data: {
        workMeId: workMeId,
        companyName: companyUnitRecord.name, // Store company name as string
        title: null, // User can set this later
        startDate: new Date(),
        endDate: null, // Current job
        description: companyDivision?.trim() || null, // Store division in description for now
      },
    }).catch((err: any) => {
      if (err.code === 'P2021') {
        throw new Error('WorkEntry table does not exist. Please run migrations.')
      }
      throw err
    })

    console.log('[API POST /api/user/update] SUCCESS (migrated to WorkEntry)', {
      workMeId,
      workEntryId: workEntry.id,
      companyName: workEntry.companyName,
      description: workEntry.description,
    })

    return NextResponse.json({
      success: true,
      message: 'Migrated to new WorkEntry pattern',
      workEntry: {
        id: workEntry.id,
        companyName: workEntry.companyName,
        startDate: workEntry.startDate,
        endDate: workEntry.endDate,
        description: workEntry.description,
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

