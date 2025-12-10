/**
 * Add Workforce Stuff Item API Route
 * 
 * AI-native flow:
 * 1. Infer CompanyX type from content
 * 2. Parse content using appropriate mapper service
 * 3. Create CompanyX record with parsed data
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import { CONTEXT_TYPE_TO_MODEL } from '@/lib/services/companyx-mapper'
import type { ContextType } from '@/lib/types/context-type'
import { EventCategory, EventAudience } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!workMeId || !companyUnit) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyUnit not set' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rawText } = body

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 }
      )
    }

    // Step 1: Infer type
    const inference = await inferCompanyXType(rawText)
    const inferredType: ContextType = inference.type

    // Step 2: Parse content using appropriate mapper
    const parsed = await parseCompanyXContent(rawText, inferredType)

    // Step 3: Create CompanyX record
    const modelName = CONTEXT_TYPE_TO_MODEL[inferredType]
    let createdRecord: any

    switch (parsed.type) {
      case 'training': {
        const data = parsed.data
        createdRecord = await prisma.companyTraining.create({
          data: {
            title: data.title || 'Untitled Training',
            description: data.description,
            topic: data.topic,
            mandatory: data.mandatory,
            sponsoringOffice: data.sponsoringOffice,
            trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            format: data.format,
            link: data.link,
            pocFirstName: data.poc.name ? data.poc.name.split(' ')[0] : null,
            pocLastName: data.poc.name ? data.poc.name.split(' ').slice(1).join(' ') : null,
            pocEmail: data.poc.email,
            pocPhone: data.poc.phone,
            pocRankOrTitle: data.poc.rankOrTitle,
            ingestRawText: rawText,
            ingestType: 'training',
            ingestStatus: 'saved',
            ingestCreatedAt: new Date(),
            summary: data.description || data.title || null,
            companyUnit,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'career': {
        const data = parsed.data
        createdRecord = await prisma.companyCareer.create({
          data: {
            title: data.title || 'Untitled Career Opportunity',
            description: data.description,
            level: data.level,
            type: data.type,
            eligibility: {
              paygradeRange: data.eligibility.paygradeRange,
              timeInServiceMonths: data.eligibility.timeInServiceMonths,
              timeInPositionMonths: data.eligibility.timeInPositionMonths,
              who: data.eligibility.who,
            },
            application: {
              instructions: data.application.instructions,
              link: data.application.link,
            },
            extras: {
              cost: data.extras.cost,
              notes: data.extras.notes,
            },
            ingestRawText: rawText,
            summary: data.description || data.title || null,
            companyUnit,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'event': {
        const data = parsed.data
        const eventData: any = {
          title: data.title || 'Untitled Event',
          theme: data.theme,
          description: data.description,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          startTime: data.startTime,
          endTime: data.endTime,
          eventCategory: data.eventCategory,
          registrationRequired: data.registrationRequired,
          registrationLink: data.registrationLink,
          audience: data.audience,
          vibe: data.vibe,
          perks: data.perks || [],
          participation: data.participation || [],
          foodProvided: data.foodProvided,
          foodTypes: data.foodTypes,
          speakers: data.speakers || [],
          pocEmail: data.pocEmail,
          pocPhone: data.pocPhone,
          summary: data.description || data.theme || data.title || null,
          companyUnit,
          createdByWorkMeId: workMeId,
        }

        createdRecord = await prisma.companyEvent.create({
          data: {
            ...eventData,
            eventItems: data.eventItems
              ? {
                  create: data.eventItems.map((item) => ({
                    title: item.title,
                    description: item.description,
                    metadata: item.metadata,
                  })),
                }
              : undefined,
          },
        })
        break
      }

      case 'campaign': {
        const data = parsed.data
        createdRecord = await prisma.companyCampaign.create({
          data: {
            title: data.title || 'Untitled Campaign',
            description: data.description,
            windowStart: data.windowStart ? new Date(data.windowStart) : null,
            windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
            ctaLink: data.ctaLink,
            sponsor: data.sponsor,
            pocFirstName: data.pocFirstName,
            pocLastName: data.pocLastName,
            pocEmail: data.pocEmail,
            pocPhone: data.pocPhone,
            summary: data.description || data.title || null,
            companyUnit,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'impact_event': {
        const data = parsed.data
        createdRecord = await prisma.companyImpactEvent.create({
          data: {
            title: data.title || 'Untitled Impact Event',
            description: data.description,
            effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
            impactedPopulation: data.impactedPopulation,
            urgency: data.urgency,
            pocFirstName: data.pocFirstName,
            pocLastName: data.pocLastName,
            pocEmail: data.pocEmail,
            pocPhone: data.pocPhone,
            summary: data.description || data.title || null,
            companyUnit,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'community': {
        const data = parsed.data
        createdRecord = await prisma.companyCommunity.create({
          data: {
            title: data.title || 'Untitled Community Opportunity',
            description: data.description,
            partnerOrg: data.partnerOrg,
            date: data.date ? new Date(data.date) : null,
            location: data.location,
            signUpLink: data.signUpLink,
            pocFirstName: data.pocFirstName,
            pocLastName: data.pocLastName,
            pocEmail: data.pocEmail,
            pocPhone: data.pocPhone,
            summary: data.description || data.title || null,
            companyUnit,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'benefits': {
        const data = parsed.data
        createdRecord = await prisma.companyBenefits.create({
          data: {
            title: data.title || 'Untitled Benefits',
            description: data.description,
            employeeBenefitSummary: data.employeeBenefitSummary,
            windowStart: data.windowStart ? new Date(data.windowStart) : null,
            windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
            actionLink: data.actionLink,
            deadlines: data.deadlines || null,
            resources: data.resources || null,
            pocList: data.pocList || null,
            ingestRawText: rawText,
            summary: data.description || data.employeeBenefitSummary || data.title || null,
            companyUnit,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'employee_cause': {
        const data = parsed.data
        createdRecord = await prisma.companyEmployeeCause.create({
          data: {
            title: data.title || 'Untitled Employee Cause',
            description: data.description,
            impactSummary: data.impactSummary,
            partnerOrg: data.partnerOrg,
            windowStart: data.windowStart ? new Date(data.windowStart) : null,
            windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
            locations: data.locations || [],
            link: data.link,
            deadlines: data.deadlines || null,
            sponsoringDepartment: data.sponsoringDepartment,
            pocList: data.pocList || null,
            extraInstructions: data.extraInstructions || null,
            ingestRawText: rawText,
            summary: data.description || data.impactSummary || data.title || null,
            companyUnit,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported type: ${(parsed as any).type}` },
          { status: 400 }
        )
    }

    // Determine redirect path based on type
    const routeMap: Record<ContextType, string> = {
      training: `/mycompany/workforcestuff/training/${createdRecord.id}`,
      career: `/mycompany/workforcestuff/career/${createdRecord.id}`,
      event: `/mycompany/workforcestuff/event/${createdRecord.id}`,
      campaign: `/mycompany/workforcestuff/campaign/${createdRecord.id}`,
      impact_event: `/mycompany/workforcestuff/impact-event/${createdRecord.id}`,
      community: `/mycompany/workforcestuff/community/${createdRecord.id}`,
      benefits: `/mycompany/workforcestuff/benefits/${createdRecord.id}`,
      employee_cause: `/mycompany/workforcestuff/employee-cause/${createdRecord.id}`,
    }

    return NextResponse.json({
      success: true,
      type: inferredType,
      confidence: inference.confidence,
      explanation: inference.explanation,
      id: createdRecord.id,
      redirectTo: routeMap[inferredType],
    })
  } catch (error: any) {
    console.error('[Add Workforce Stuff] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add workforce item' },
      { status: 500 }
    )
  }
}
