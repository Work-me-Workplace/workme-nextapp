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

    const { description, date, milestoneType, platformUnitId, title, category } = await request.json()

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Look up platform unit to generate title if not provided and platformUnitId exists
    let milestoneTitle = title
    if (!milestoneTitle && platformUnitId) {
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
        if (milestoneType) {
          const milestoneTypeLabel = milestoneType.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, (l: string) => l.toUpperCase())
          milestoneTitle = `${unitName} ${milestoneTypeLabel}`
        } else {
          milestoneTitle = `${unitName} Milestone`
        }
      } else {
        milestoneTitle = milestoneType ? `${milestoneType.replace(/_/g, ' ')} Milestone` : 'Company Milestone'
      }
    }

    const milestone = await prisma.companyMilestone.create({
      data: {
        title: milestoneTitle,
        companyId,
        category: category || undefined,
        milestoneType: milestoneType || undefined,
        description: description || undefined,
        date: date ? new Date(date) : undefined,
        platformUnitId: platformUnitId || undefined,
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
