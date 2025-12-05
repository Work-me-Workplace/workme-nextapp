import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workhistory
 * 
 * Get WorkEntry list for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const workEntries = await prisma.workEntry.findMany({
      where: { workMeId },
      orderBy: [
        { endDate: 'desc' }, // Current jobs first (endDate = null)
        { startDate: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      workEntries: workEntries || [],
    })
  } catch (error: any) {
    console.error('❌ WorkHistoryGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get work history' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/workhistory
 * 
 * Create new WorkEntry
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { companyName, title, startDate, endDate, description } = body

    const workEntry = await prisma.workEntry.create({
      data: {
        workMeId,
        companyName: companyName || null,
        title: title || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
      },
    })

    return NextResponse.json({
      success: true,
      workEntry,
    })
  } catch (error: any) {
    console.error('❌ WorkHistoryCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create work entry' },
      { status: 500 },
    )
  }
}

