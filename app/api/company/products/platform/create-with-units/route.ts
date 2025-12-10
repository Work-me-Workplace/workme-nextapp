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
        programCode: platform.programCode || null,
        description: platform.description || null,
        whySpecial: platform.whySpecial || null,
      },
    })

    // Create units if provided
    if (Array.isArray(units) && units.length > 0) {
      await prisma.companyPlatformUnit.createMany({
        data: units.map((unit: any) => ({
          platformProductId: product.id,
          hullNumber: unit.hullNumber,
          name: unit.name || null,
          lifecycleStatus: unit.lifecycleStatus || null,
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
        milestones.map((milestone: any) =>
          prisma.companyMilestone.create({
            data: {
              title: milestone.title,
              description: milestone.description || null,
              date: milestone.date ? new Date(milestone.date) : null,
              milestoneType: 'PRODUCT',
              platformUnitId: milestone.unitHullNumber && unitMap[milestone.unitHullNumber]
                ? unitMap[milestone.unitHullNumber]
                : null,
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
