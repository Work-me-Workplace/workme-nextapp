import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { workMeId: string } }
) {
  try {
    const { workMeId } = params

    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      include: {
        company: true,
      },
    })

    if (!workMe) {
      return NextResponse.json(
        { success: false, error: 'WorkMe not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, workMe })
  } catch (error: any) {
    console.error('Error fetching WorkMe:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch WorkMe' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { workMeId: string } }
) {
  try {
    const { workMeId } = params
    const body = await request.json()

    const {
      jobTitle,
      specialty,
      industry,
      jobRole,
      annualSalary,
      salaryRange,
      workLocation,
      city,
      state,
    } = body

    const workMe = await prisma.workMe.update({
      where: { id: workMeId },
      data: {
        ...(jobTitle !== undefined && { jobTitle }),
        ...(specialty !== undefined && { specialty }),
        ...(industry !== undefined && { industry }),
        ...(jobRole !== undefined && { jobRole: jobRole as any }),
        ...(annualSalary !== undefined && { annualSalary }),
        ...(salaryRange !== undefined && { salaryRange: salaryRange as any }),
        ...(workLocation !== undefined && { workLocation }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
      },
    })

    return NextResponse.json({ success: true, workMe })
  } catch (error: any) {
    console.error('Error updating WorkMe:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update WorkMe' },
      { status: 500 }
    )
  }
}

