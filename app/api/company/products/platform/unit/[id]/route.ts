import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await prisma.companyPlatformUnit.findUnique({
      where: { id: params.id },
      include: {
        platformProduct: true,
        milestones: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Unit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      unit,
    })
  } catch (error: any) {
    console.error('Failed to get unit:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
