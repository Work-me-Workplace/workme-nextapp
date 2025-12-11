import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface CreateDigitalSignageRequest {
  signType: DigitalSignType
  companyUnit?: string
  // Workforce Achievement (structured output from GPT)
  workforceAchievement?: {
    headline: string
    subhead?: string | null
    detailBlock?: string | null
    runtimeGuidance?: string | null
    imageAssetId?: string | null
    employeeId?: string | null
    highlightId?: string | null
  }
  // Workforce
  workforce?: {
    title: string
    summary?: string
    bullets?: string[]
    icon?: string
    background?: string
    footerNote?: string
  }
  // Company News
  companyNews?: {
    headline: string
    subheadline?: string
    body?: string
    link?: string
  }
  // Company Event
  companyEvent?: {
    eventName: string
    eventDate?: string
    startTime?: string
    endTime?: string
    location?: string
    description?: string
    perks?: string[]
    registrationLink?: string
  }
}

/**
 * POST /api/mywork/digital-signage/create
 * 
 * Create a new digital signage product
 * This is the save route - expects structured data (already processed by GPT)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireWorkMeAuth(request)
    const body: CreateDigitalSignageRequest = await request.json()
    const { signType, companyUnit, workforceAchievement, workforce, companyNews, companyEvent } = body

    // Validate sign type
    if (!signType || !Object.values(DigitalSignType).includes(signType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signType. Must be one of: WORKFORCE, COMPANY_NEWS, WORKFORCE_ACHIEVEMENT, COMPANY_EVENT' },
        { status: 400 }
      )
    }

    // Validate that the appropriate data is provided for the sign type
    if (signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && !workforceAchievement) {
      return NextResponse.json(
        { success: false, error: 'workforceAchievement data is required for WORKFORCE_ACHIEVEMENT sign type' },
        { status: 400 }
      )
    }

    if (signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && !workforceAchievement.headline) {
      return NextResponse.json(
        { success: false, error: 'headline is required for WORKFORCE_ACHIEVEMENT sign type' },
        { status: 400 }
      )
    }

    if (signType === DigitalSignType.WORKFORCE && !workforce) {
      return NextResponse.json(
        { success: false, error: 'workforce data is required for WORKFORCE sign type' },
        { status: 400 }
      )
    }

    if (signType === DigitalSignType.COMPANY_NEWS && !companyNews) {
      return NextResponse.json(
        { success: false, error: 'companyNews data is required for COMPANY_NEWS sign type' },
        { status: 400 }
      )
    }

    if (signType === DigitalSignType.COMPANY_EVENT && !companyEvent) {
      return NextResponse.json(
        { success: false, error: 'companyEvent data is required for COMPANY_EVENT sign type' },
        { status: 400 }
      )
    }

    // Create the digital signage product
    const signage = await prisma.productDigitalSign.create({
      data: {
        signType,
        companyUnit: companyUnit || null,
        createdByWorkMeId: auth.id,
        ...(signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && workforceAchievement && {
          workforceAchievement: {
            create: {
              headline: workforceAchievement.headline,
              subhead: workforceAchievement.subhead || null,
              detailBlock: workforceAchievement.detailBlock || null,
              runtimeGuidance: workforceAchievement.runtimeGuidance || '1 week',
              imageAssetId: workforceAchievement.imageAssetId || null,
              employeeId: workforceAchievement.employeeId || null,
              highlightId: workforceAchievement.highlightId || null,
            }
          }
        }),
        ...(signType === DigitalSignType.WORKFORCE && workforce && {
          workforce: {
            create: {
              title: workforce.title,
              summary: workforce.summary || null,
              bullets: workforce.bullets || [],
              icon: workforce.icon || null,
              background: workforce.background || null,
              footerNote: workforce.footerNote || null,
            }
          }
        }),
        ...(signType === DigitalSignType.COMPANY_NEWS && companyNews && {
          companyNews: {
            create: {
              headline: companyNews.headline,
              subheadline: companyNews.subheadline || null,
              body: companyNews.body || null,
              link: companyNews.link || null,
            }
          }
        }),
        ...(signType === DigitalSignType.COMPANY_EVENT && companyEvent && {
          companyEvent: {
            create: {
              eventName: companyEvent.eventName,
              eventDate: companyEvent.eventDate ? new Date(companyEvent.eventDate) : null,
              startTime: companyEvent.startTime || null,
              endTime: companyEvent.endTime || null,
              location: companyEvent.location || null,
              description: companyEvent.description || null,
              perks: companyEvent.perks || [],
              registrationLink: companyEvent.registrationLink || null,
            }
          }
        }),
      },
      include: {
        workforceAchievement: true,
        workforce: true,
        companyNews: true,
        companyEvent: true,
      }
    })

    return NextResponse.json({
      success: true,
      signage,
    })
  } catch (error: any) {
    console.error('❌ POST /api/mywork/digital-signage/create error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create digital signage',
      },
      { status: 500 }
    )
  }
}
