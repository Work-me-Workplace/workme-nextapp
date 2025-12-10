import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { description, date, milestoneType, platformUnitId } = await request.json()

    if (!platformUnitId) {
      return NextResponse.json(
        { success: false, error: 'Platform unit ID is required' },
        { status: 400 }
      )
    }

    if (!milestoneType) {
      return NextResponse.json(
        { success: false, error: 'Milestone type is required' },
        { status: 400 }
      )
    }

    const milestone = await prisma.companyMilestone.create({
      data: {
        description: description || null,
        date: date ? new Date(date) : null,
        milestoneType,
        platformUnitId,
      },
    })

    return NextResponse.json({
      success: true,
      milestone,
    })
  } catch (error: any) {
    console.error('Failed to create milestone:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
