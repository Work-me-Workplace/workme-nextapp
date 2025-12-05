import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/outlook
 * 
 * Get WorkOutlookItems for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const where: any = { workMeId }
    if (date) {
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const workOutlookItems = await prisma.workOutlookItem.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({
      success: true,
      workOutlookItems: workOutlookItems || [],
    })
  } catch (error: any) {
    console.error('❌ WorkOutlookGet error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get work outlook' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/outlook
 * 
 * Create new WorkOutlookItem
 */
export async function POST(request: NextRequest) {
  try {
    const { firebaseId } = await verifyAuth(request as Request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId } = workMe

    const body = await request.json()
    const { date, item, status } = body

    if (!date || !item) {
      return NextResponse.json(
        { success: false, error: 'date and item are required' },
        { status: 400 },
      )
    }

    const workOutlookItem = await prisma.workOutlookItem.create({
      data: {
        workMeId,
        date: new Date(date),
        item,
        status: status || null,
      },
    })

    return NextResponse.json({
      success: true,
      workOutlookItem,
    })
  } catch (error: any) {
    console.error('❌ WorkOutlookCreate error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create work outlook item' },
      { status: 500 },
    )
  }
}
