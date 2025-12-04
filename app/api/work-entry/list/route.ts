import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/work-entry/list
 * 
 * Get all work entries for current authenticated user
 * Returns work history (current + past jobs)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth(request as Request)
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    // 3. Fetch all work entries for this user
    const workEntries = await prisma.workEntry.findMany({
      where: { userId: workMeId },
      include: {
        companyUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { endDate: 'desc' }, // Current jobs first (endDate = null)
        { startDate: 'desc' }, // Then by start date
      ],
    })

    return NextResponse.json({
      success: true,
      workEntries: workEntries.map(entry => ({
        id: entry.id,
        companyUnit: entry.companyUnit,
        division: entry.division,
        title: entry.title,
        startDate: entry.startDate,
        endDate: entry.endDate,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
    })
  } catch (error: any) {
    console.error('❌ WorkEntryList error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list work entries' },
      { status: 500 },
    )
  }
}

