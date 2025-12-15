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

    const { description, date, milestoneType, platformUnitId, title } = await request.json()

    if (!platformUnitId) {
      return NextResponse.json(
        { success: false, error: 'Platform unit ID is required' },
        { status: 400 }
      )
    }

    if (!milestoneType) {
      return NextResponse.json(
        { success: false, error: 'Milestone type is required' },
        { status: 400 }
      )
    }

    // Look up platform unit to generate title if not provided
    let milestoneTitle = title
    if (!milestoneTitle) {
      const platformUnit = await prisma.companyPlatformUnit.findUnique({
        where: { id: platformUnitId },
        select: {
          hullNumber: true,
          name: true,
          platformProduct: {
            select: {
              name: true,
            },
          },
        },
      })

      if (platformUnit) {
        const unitName = platformUnit.name || platformUnit.hullNumber
        const milestoneTypeLabel = milestoneType.replace(/_/g, ' ').toLowerCase()
          .replace(/\b\w/g, (l: string) => l.toUpperCase())
        milestoneTitle = `${unitName} ${milestoneTypeLabel}`
      } else {
        milestoneTitle = `${milestoneType.replace(/_/g, ' ')} Milestone`
      }
    }

    const milestone = await prisma.companyMilestone.create({
      data: {
        title: milestoneTitle,
        companyId: workMeContext.companyId,
        description: description || null,
        date: date ? new Date(date) : null,
        milestoneType,
        platformUnitId,
      },
    })

    return NextResponse.json({
      success: true,
      milestone,
    })
  } catch (error: any) {
    console.error('Failed to create milestone:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
