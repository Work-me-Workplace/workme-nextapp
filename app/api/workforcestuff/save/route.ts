/**
 * Save Workforce Stuff Item API Route
 * 
 * STEP 3: Save the reviewed and edited data to database
 * This happens AFTER user reviews type inference and parsed fields
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { CONTEXT_TYPE_TO_ROUTE } from '@/lib/services/companyx-mapper'
import type { ContextType } from '@/lib/types/context-type'

export async function POST(request: NextRequest) {
  try {
    // Auth
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, data, rawText } = body

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'type and data are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes: ContextType[] = [
      'training',
      'career',
      'event',
      'campaign',
      'impact_event',
      'community',
      'benefits',
      'employee_cause',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type: ${type}` },
        { status: 400 }
      )
    }

    let createdRecord: any

    // Create the record based on type
    switch (type) {
      case 'training': {
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
            pocFirstName: data.poc?.name ? data.poc.name.split(' ')[0] : null,
            pocLastName: data.poc?.name ? data.poc.name.split(' ').slice(1).join(' ') : null,
            pocEmail: data.poc?.email,
            pocPhone: data.poc?.phone,
            pocRankOrTitle: data.poc?.rankOrTitle,
            ingestRawText: rawText,
            ingestType: 'training',
            ingestStatus: 'saved',
            ingestCreatedAt: new Date(),
            summary: data.description || data.title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'career': {
        createdRecord = await prisma.companyCareer.create({
          data: {
            title: data.title || 'Untitled Career Opportunity',
            description: data.description,
            level: data.level,
            type: data.type,
            eligibility: {
              paygradeRange: data.eligibility?.paygradeRange,
              timeInServiceMonths: data.eligibility?.timeInServiceMonths,
              timeInPositionMonths: data.eligibility?.timeInPositionMonths,
              who: data.eligibility?.who,
            },
            application: {
              instructions: data.application?.instructions,
              link: data.application?.link,
            },
            extras: {
              cost: data.extras?.cost,
              notes: data.extras?.notes,
            },
            ingestRawText: rawText,
            summary: data.description || data.title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'event': {
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
          companyId,
          createdByWorkMeId: workMeId,
        }

        createdRecord = await prisma.companyEvent.create({
          data: {
            ...eventData,
            eventItems: data.eventItems
              ? {
                  create: data.eventItems.map((item: any) => ({
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
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'impact_event': {
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
            ingestRawText: data.rawText || data.ingestRawText || null, // SAVE THE RAW TEXT!
            summary: data.summary || data.description || data.title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'community': {
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
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'benefits': {
        createdRecord = await prisma.companyBenefits.create({
          data: {
            title: data.title || 'Untitled Benefits',
            description: data.description,
            employeeBenefitSummary: data.employeeBenefitSummary,
            windowStart: data.windowStart ? new Date(data.windowStart) : null,
            windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
            actionLink: data.actionLink,
            ...(data.deadlines != null ? { deadlines: data.deadlines } : {}),
            ...(data.resources != null ? { resources: data.resources } : {}),
            ...(data.pocList != null ? { pocList: data.pocList } : {}),
            ingestRawText: rawText,
            summary: data.description || data.employeeBenefitSummary || data.title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'employee_cause': {
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
            ...(data.deadlines != null ? { deadlines: data.deadlines } : {}),
            sponsoringDepartment: data.sponsoringDepartment,
            ...(data.pocList != null ? { pocList: data.pocList } : {}),
            ...(data.extraInstructions != null ? { extraInstructions: data.extraInstructions } : {}),
            ingestRawText: rawText,
            summary: data.description || data.impactSummary || data.title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported type: ${type}` },
          { status: 400 }
        )
    }

    // Build redirect path
    const routeSegment = CONTEXT_TYPE_TO_ROUTE[type as ContextType]
    const redirectTo = `/mycompany/workforcestuff/${routeSegment}/${createdRecord.id}`

    return NextResponse.json({
      success: true,
      id: createdRecord.id,
      type,
      redirectTo,
    })
  } catch (error: any) {
    console.error('[Save Workforce Stuff] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save workforce item' },
      { status: 500 }
    )
  }
}


