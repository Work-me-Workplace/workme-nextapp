import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const {
      platformProductId,
      hullNumber,
      name,
      shipyard,
      description,
      status,
      percentComplete,
      deliveryExpected,
    } = await request.json()

    if (!platformProductId || !hullNumber) {
      return NextResponse.json(
        { success: false, error: 'Platform Product ID and Hull Number are required' },
        { status: 400 }
      )
    }

    const unit = await prisma.companyPlatformUnit.create({
      data: {
        platformProductId,
        hullNumber,
        name: name || undefined,
        shipyard: shipyard || undefined,
        description: description || undefined,
        status: status || undefined,
        percentComplete: percentComplete ?? undefined,
        deliveryExpected: deliveryExpected ? new Date(deliveryExpected) : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      unit,
    })
  } catch (error: any) {
    console.error('Failed to create platform unit:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
