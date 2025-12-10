import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.companyPlatformProduct.findUnique({
      where: { id: params.id },
      include: {
        units: {
          orderBy: { hullNumber: 'asc' },
        },
        statements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Platform product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Failed to get platform product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
