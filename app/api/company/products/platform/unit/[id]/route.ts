import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const unit = await prisma.companyPlatformUnit.findUnique({
      where: { id },
      include: {
        platformProduct: true,
        namesake: true,
        livingHomage: true,
        milestones: {
          orderBy: { date: 'asc' },
        },
        statements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            statement: {
              select: {
                id: true,
                headline: true,
                sourceName: true,
              },
            },
          },
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
