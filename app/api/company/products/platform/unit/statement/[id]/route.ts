import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const statement = await prisma.companyPlatformUnitStatement.findUnique({
      where: { id },
      include: {
        platformUnit: {
          select: {
            id: true,
            hullNumber: true,
            name: true,
          },
        },
      },
    })

    if (!statement) {
      return NextResponse.json(
        { success: false, error: 'Statement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      statement,
    })
  } catch (error: any) {
    console.error('Failed to get statement:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
