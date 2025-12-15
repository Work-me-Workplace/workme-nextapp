import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { platform, units, milestones } = await request.json()

    if (!platform || !platform.name || !platform.category) {
      return NextResponse.json(
        { success: false, error: 'Platform name and category are required' },
        { status: 400 }
      )
    }

    // Create platform product
    const product = await prisma.companyPlatformProduct.create({
      data: {
        name: platform.name,
        category: platform.category,
        platformSeries: platform.platformSeries || null,
        description: platform.description || null,
        whySpecial: platform.whySpecial || null,
        payloadNotes: platform.payloadNotes || null,
        intendedTotalUnits: platform.intendedTotalUnits || null,
        knownShipsInClass: Array.isArray(platform.knownShipsInClass) ? platform.knownShipsInClass : [],
        currentProgressEstimate: platform.currentProgressEstimate || null,
        programStatus: platform.programStatus || null,
        nextDeliveryExpected: platform.nextDeliveryExpected ? new Date(platform.nextDeliveryExpected) : null,
        lastDeliveryDate: platform.lastDeliveryDate ? new Date(platform.lastDeliveryDate) : null,
        totalLength: platform.totalLength || null,
        totalBeam: platform.totalBeam || null,
        totalDisplacementSubmerged: platform.totalDisplacementSubmerged || null,
        totalManpowerNeeds: platform.totalManpowerNeeds || null,
        totalTimeToBuild: platform.totalTimeToBuild || null,
        totalEstimatedCostPerUnit: platform.totalEstimatedCostPerUnit || null,
        sensors: Array.isArray(platform.sensors) ? platform.sensors : [],
        defenseBuilders: Array.isArray(platform.defenseBuilders) ? platform.defenseBuilders : [],
        unitsInSeries: Array.isArray(platform.unitsInSeries) ? platform.unitsInSeries : [],
        classStartDate: platform.classStartDate ? new Date(platform.classStartDate) : null,
      },
    })

    // Create units if provided
    if (Array.isArray(units) && units.length > 0) {
      await prisma.companyPlatformUnit.createMany({
        data: units.map((unit: any) => ({
          platformProductId: product.id,
          hullNumber: unit.hullNumber,
          name: unit.name || null,
          status: unit.lifecycleStatus || null,
        })),
      })
    }

    // Create milestones if provided
    if (Array.isArray(milestones) && milestones.length > 0) {
      // Get unit IDs if we created units
      let unitMap: Record<string, string> = {}
      if (units && units.length > 0) {
        const createdUnits = await prisma.companyPlatformUnit.findMany({
          where: { platformProductId: product.id },
        })
        unitMap = createdUnits.reduce((acc, unit, idx) => {
          if (units[idx]) {
            acc[units[idx].hullNumber] = unit.id
          }
          return acc
        }, {} as Record<string, string>)
      }

      await Promise.all(
        milestones
          .filter((milestone: any) => {
            // Only create milestones that have both a unit and a valid milestoneType
            return (
              milestone.unitHullNumber &&
              unitMap[milestone.unitHullNumber] &&
              milestone.milestoneType &&
              ['CONTRACT_AWARDED', 'KEEL_LAYING', 'HULL_COMPLETION', 'LAUNCH', 'SEA_TRIALS', 'DELIVERY', 'COMMISSIONING'].includes(milestone.milestoneType)
            )
          })
          .map((milestone: any) =>
            prisma.companyMilestone.create({
              data: {
                description: milestone.description || null,
                date: milestone.date ? new Date(milestone.date) : null,
                milestoneType: milestone.milestoneType,
                platformUnitId: unitMap[milestone.unitHullNumber],
              },
            })
          )
      )
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Failed to create platform with units:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
