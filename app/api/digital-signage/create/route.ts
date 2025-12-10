import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface CreateDigitalSignageRequest {
  signType: DigitalSignType
  companyUnit?: string
  // Workforce Achievement
  workforceAchievement?: {
    personName: string
    unit?: string
    achievement: string
    details?: string
    photoUrl?: string
  }
  // Workforce
  workforce?: {
    title: string
    summary?: string
    bullets?: string[]
    imageUrl?: string
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
    thumbnail?: string
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
 * POST /api/digital-signage/create
 * 
 * Create a new digital signage product
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
              personName: workforceAchievement.personName,
              unit: workforceAchievement.unit || null,
              achievement: workforceAchievement.achievement,
              details: workforceAchievement.details || null,
              photoUrl: workforceAchievement.photoUrl || null,
            }
          }
        }),
        ...(signType === DigitalSignType.WORKFORCE && workforce && {
          workforce: {
            create: {
              title: workforce.title,
              summary: workforce.summary || null,
              bullets: workforce.bullets || [],
              imageUrl: workforce.imageUrl || null,
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
              thumbnail: companyNews.thumbnail || null,
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
    console.error('❌ POST /api/digital-signage/create error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create digital signage',
      },
      { status: 500 }
    )
  }
}
