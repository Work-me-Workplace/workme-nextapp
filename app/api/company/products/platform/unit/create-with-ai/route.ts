import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { platformProductId, unit } = await request.json()

    if (!platformProductId || !unit || !unit.hullNumber) {
      return NextResponse.json(
        { success: false, error: 'Platform Product ID and unit hullNumber are required' },
        { status: 400 }
      )
    }

    // Create unit - statements and milestones are handled by downstream services
    const createdUnit = await prisma.companyPlatformUnit.create({
      data: {
        platformProductId,
        hullNumber: unit.hullNumber,
        name: unit.name || undefined,
        numberInClass: unit.numberInClass ?? undefined,
        platformClass: unit.platformClass || undefined,
        defenseContractor: unit.defenseContractor || undefined,
        shipyard: unit.shipyard || undefined,
        whereBuilt: unit.whereBuilt || undefined,
        unitCost: unit.unitCost || undefined,
        constructionStartDate: unit.constructionStartDate ? new Date(unit.constructionStartDate) : undefined,
        constructionCompleteDate: unit.constructionCompleteDate ? new Date(unit.constructionCompleteDate) : undefined,
        deliveryToFleetDate: unit.deliveryToFleetDate ? new Date(unit.deliveryToFleetDate) : undefined,
        commissioningDate: unit.commissioningDate ? new Date(unit.commissioningDate) : undefined,
        homeport: unit.homeport || undefined,
        currentStatus: unit.currentStatus || undefined,
        percentComplete: unit.percentComplete ?? undefined,
        createdVia: unit.createdVia || 'AI_INGEST',
      },
    })

    return NextResponse.json({
      success: true,
      unit: createdUnit,
    })
  } catch (error: any) {
    console.error('Failed to create platform unit with AI:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create platform unit' },
      { status: 500 }
    )
  }
}
