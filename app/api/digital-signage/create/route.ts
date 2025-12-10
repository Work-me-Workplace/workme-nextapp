import { NextRequest, NextResponse } from 'next/server'
import { requireWorkMeAuth } from '@/lib/server/requireWorkMeAuth'
import { prisma } from '@/lib/prisma'
import { DigitalSignType } from '@prisma/client'
import { buildDigitalSignFromHighlight } from '@/lib/services/digital-sign-employee-highlight-builder-service'

export const dynamic = 'force-dynamic'

interface CreateDigitalSignageRequest {
  signType: DigitalSignType
  companyUnit?: string
  // Workforce Achievement (new structure)
  workforceAchievement?: {
    // Option 1: Provide highlightId to build from existing highlight
    highlightId?: string
    // Option 2: Provide raw data to build from scratch
    employeeId?: string
    employeeFullName?: string
    employeeTitle?: string
    employeeUnit?: string
    awardName?: string
    awardingAgency?: string
    awardYear?: number
    achievement?: string
    citationText?: string
    classification?: string
    // Final slide data (if already built)
    headline?: string
    subhead?: string
    detailBlock?: string
    runtimeGuidance?: string
    imageAssetId?: string
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

    // For WORKFORCE_ACHIEVEMENT, build the final slide if highlightId provided
    let builtSignageData: {
      headline: string
      subhead: string | null
      detailBlock: string | null
      runtimeGuidance: string
      imageAssetId?: string
      employeeId?: string
      highlightId?: string
    } | null = null

    if (signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && workforceAchievement) {
      // If highlightId provided, fetch highlight and build
      if (workforceAchievement.highlightId) {
        const highlight = await prisma.companyEmployeeHighlight.findUnique({
          where: { id: workforceAchievement.highlightId },
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                title: true,
                companyUnit: true,
              }
            }
          }
        })

        if (!highlight || !highlight.employee) {
          return NextResponse.json(
            { success: false, error: 'Highlight not found or has no employee' },
            { status: 404 }
          )
        }

        // Build using the builder service
        const built = await buildDigitalSignFromHighlight({
          employeeFullName: highlight.employee.fullName,
          employeeTitle: highlight.employee.title,
          employeeUnit: highlight.companyUnitLabel || highlight.employee.companyUnit,
          awardName: highlight.awardName,
          awardingAgency: highlight.awardingAgency,
          awardYear: highlight.awardYear,
          achievement: highlight.achievement,
          citationText: highlight.citationText,
          classification: highlight.classification,
        })

        builtSignageData = {
          ...built,
          imageAssetId: workforceAchievement.imageAssetId,
          employeeId: highlight.employeeId,
          highlightId: highlight.id,
        }
      } else if (workforceAchievement.headline) {
        // Already built, use provided data
        builtSignageData = {
          headline: workforceAchievement.headline,
          subhead: workforceAchievement.subhead || null,
          detailBlock: workforceAchievement.detailBlock || null,
          runtimeGuidance: workforceAchievement.runtimeGuidance || '1 week',
          imageAssetId: workforceAchievement.imageAssetId,
          employeeId: workforceAchievement.employeeId,
        }
      } else if (workforceAchievement.citationText) {
        // Build from raw data
        const built = await buildDigitalSignFromHighlight({
          employeeFullName: workforceAchievement.employeeFullName || '',
          employeeTitle: workforceAchievement.employeeTitle,
          employeeUnit: workforceAchievement.employeeUnit,
          awardName: workforceAchievement.awardName,
          awardingAgency: workforceAchievement.awardingAgency,
          awardYear: workforceAchievement.awardYear,
          achievement: workforceAchievement.achievement,
          citationText: workforceAchievement.citationText,
          classification: workforceAchievement.classification,
        })

        builtSignageData = {
          ...built,
          imageAssetId: workforceAchievement.imageAssetId,
          employeeId: workforceAchievement.employeeId,
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'workforceAchievement must provide highlightId, headline, or citationText' },
          { status: 400 }
        )
      }
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

    // Get companyUnit from highlight if not provided and highlightId exists
    let finalCompanyUnit = companyUnit || null
    if (signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && workforceAchievement?.highlightId && !finalCompanyUnit) {
      const highlight = await prisma.companyEmployeeHighlight.findUnique({
        where: { id: workforceAchievement.highlightId },
        select: { companyUnitLabel: true }
      })
      if (highlight?.companyUnitLabel) {
        finalCompanyUnit = highlight.companyUnitLabel
      }
    }

    // Create the digital signage product
    const signage = await prisma.productDigitalSign.create({
      data: {
        signType,
        companyUnit: finalCompanyUnit,
        createdByWorkMeId: auth.id,
        ...(signType === DigitalSignType.WORKFORCE_ACHIEVEMENT && builtSignageData && {
          workforceAchievement: {
            create: {
              headline: builtSignageData.headline,
              subhead: builtSignageData.subhead || null,
              detailBlock: builtSignageData.detailBlock || null,
              runtimeGuidance: builtSignageData.runtimeGuidance,
              imageAssetId: builtSignageData.imageAssetId || null,
              employeeId: builtSignageData.employeeId || null,
              highlightId: builtSignageData.highlightId || null,
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
