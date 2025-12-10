import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { title, description, date, milestoneType, platformUnitId } = await request.json()

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    const milestone = await prisma.companyMilestone.create({
      data: {
        title,
        description: description || null,
        date: date ? new Date(date) : null,
        milestoneType: milestoneType || null,
        platformUnitId: platformUnitId || null,
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
