import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkMeContext } from '@/lib/server/getWorkMeContext'

export async function POST(request: NextRequest) {
  try {
    // Get WorkMe context for companyId
    const workMeContext = await getWorkMeContext(request)
    
    if (!workMeContext.companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required. Please set your company affiliation.' },
        { status: 400 }
      )
    }

    // TypeScript: companyId is now guaranteed to be string after the check above
    const companyId: string = workMeContext.companyId

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
          name: unit.name || undefined,
          currentStatus: unit.lifecycleStatus || undefined,
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
          .map(async (milestone: any) => {
            const platformUnitId = unitMap[milestone.unitHullNumber]
            
            // Look up platform unit to generate title
            const platformUnit = await prisma.companyPlatformUnit.findUnique({
              where: { id: platformUnitId },
              select: {
                hullNumber: true,
                name: true,
              },
            })

            // Generate title from unit info and milestone type
            let milestoneTitle = milestone.title
            if (!milestoneTitle) {
              const unitName = platformUnit?.name || platformUnit?.hullNumber || milestone.unitHullNumber
              const milestoneTypeLabel = milestone.milestoneType.replace(/_/g, ' ').toLowerCase()
                .replace(/\b\w/g, (l: string) => l.toUpperCase())
              milestoneTitle = `${unitName} ${milestoneTypeLabel}`
            }

            return prisma.companyMilestone.create({
              data: {
                title: milestoneTitle,
                companyId,
                category: 'Platform',
                description: milestone.description || undefined,
                date: milestone.date ? new Date(milestone.date) : undefined,
                milestoneType: milestone.milestoneType || undefined,
                platformUnitId: platformUnitId || undefined,
              },
            })
          })
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
