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

    const { description, date, milestoneType, title, category, platformUnitId } = await request.json()

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // CRITICAL: CompanyMilestone is for BIG PICTURE company-wide milestones
    // platformUnitId is OPTIONAL - only for HUGE company-wide events that happen to involve a specific unit
    // Examples: "Carrier flew its first mission", "First submarine completed circumnavigation"
    // Do NOT auto-create company milestones from unit updates - this is manual creation only
    const milestone = await prisma.companyMilestone.create({
      data: {
        title,
        companyId,
        category: category || undefined,
        milestoneType: milestoneType || undefined,
        description: description || undefined,
        date: date ? new Date(date) : undefined,
        platformUnitId: platformUnitId || undefined, // Optional - only for huge company-wide events
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
