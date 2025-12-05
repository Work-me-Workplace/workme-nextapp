import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/work-entry/create
 * 
 * Create work entry (employment history)
 * WorkEntry uses companyName (string) not companyUnitId
 * 
 * Body: {
 *   companyName: string,
 *   title?: string,
 *   startDate?: string (ISO date),
 *   endDate?: string (ISO date) // null = current
 *   description?: string
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
    const { companyName, title, startDate, endDate, description } = body

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyName is required' },
        { status: 400 },
      )
    }

    // Create WorkEntry (uses companyName string, not companyUnitId)
    const workEntry = await prisma.workEntry.create({
      data: {
        workMeId,
        companyName: companyName.trim(),
        title: title?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description?.trim() || null,
      },
    }).catch((err: any) => {
      if (err.code === 'P2021') {
        throw new Error('WorkEntry table does not exist. Please run migrations.')
      }
      throw err
    })

    console.log('✅ WorkEntry created:', workEntry.id)

    return NextResponse.json({
      success: true,
      workEntry: {
        id: workEntry.id,
        workMeId: workEntry.workMeId,
        companyName: workEntry.companyName,
        title: workEntry.title,
        startDate: workEntry.startDate,
        endDate: workEntry.endDate,
        description: workEntry.description,
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
