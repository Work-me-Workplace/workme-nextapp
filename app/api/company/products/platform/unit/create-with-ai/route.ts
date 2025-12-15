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
        name: unit.name || null,
        numberInClass: unit.numberInClass || null,
        platformClass: unit.platformClass || null,
        defenseContractor: unit.defenseContractor || null,
        shipyard: unit.shipyard || null,
        whereBuilt: unit.whereBuilt || null,
        unitCost: unit.unitCost || null,
        constructionStartDate: unit.constructionStartDate ? new Date(unit.constructionStartDate) : null,
        constructionCompleteDate: unit.constructionCompleteDate ? new Date(unit.constructionCompleteDate) : null,
        deliveryToFleetDate: unit.deliveryToFleetDate ? new Date(unit.deliveryToFleetDate) : null,
        commissioningDate: unit.commissioningDate ? new Date(unit.commissioningDate) : null,
        homeport: unit.homeport || null,
        currentStatus: unit.currentStatus || null,
        percentComplete: unit.percentComplete || null,
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
