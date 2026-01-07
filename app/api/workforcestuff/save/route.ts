/**
 * Save Workforce Stuff Item API Route
 * 
 * Modular ingest pattern:
 * 1. Create CompanyX with ingest snapshot (using createCompanyXWithIngest)
 * 2. Parse the content (using parseCompanyXContent - calls the parser)
 * 3. Update the record with parsed data
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { CONTEXT_TYPE_TO_ROUTE, CONTEXT_TYPE_TO_MODEL, createCompanyXWithIngest } from '@/lib/services/companyx-mapper'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import type { ContextType } from '@/lib/types/context-type'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

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
    const { type, rawText } = body

    if (!type || !rawText) {
      return NextResponse.json(
        { success: false, error: 'type and rawText are required' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes: ContextType[] = [
      'training',
      'career',
      'event',
      'leader_engagement',
      'campaign',
      'impact_event',
      'community',
      'benefits',
      'employee_cause',
    ]

    if (!validTypes.includes(type as ContextType)) {
      return NextResponse.json(
        { success: false, error: `Invalid type: ${type}` },
        { status: 400 }
      )
    }

    // STEP 1: Create CompanyX with ingest snapshot (modular ingest pattern)
    const ingestResult = await createCompanyXWithIngest(
      prisma,
      type as ContextType,
      rawText,
      workMeId,
      companyId
    )

    // STEP 2: Parse the content (calls the parser)
    const parsed = await parseCompanyXContent(rawText, type as ContextType)

    // STEP 3: Update the record with parsed data
    const modelName = CONTEXT_TYPE_TO_MODEL[type as ContextType]
    const parsedData = parsed.data

    let updatedRecord: any

    // Map parsed data to update fields based on type
    switch (type) {
      case 'training': {
        const data = parsedData as any
        const pocName = data.poc?.name || ''
        const nameParts = pocName.split(' ')
        const pocFirstName = nameParts[0] || null
        const pocLastName = nameParts.slice(1).join(' ') || null

        updatedRecord = await prisma.companyTraining.update({
          where: { id: ingestResult.id },
          data: {
            title: data.title || 'Untitled Training',
            description: data.description,
            topic: data.topic,
            mandatory: data.mandatory ?? false,
            sponsoringOffice: data.sponsoringOffice,
            trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            format: data.format,
            link: data.link,
            pocFirstName,
            pocLastName,
            pocEmail: data.poc?.email,
            pocPhone: data.poc?.phone,
            pocRankOrTitle: data.poc?.rankOrTitle,
            ingestStatus: 'saved',
            summary: data.description || data.title || null,
          },
        })
        break
      }

      case 'career': {
        const data = parsedData as any
        // Filter out any skills-related leakage
        const { skillsRaw, strengthsRaw, specialties, certifications, workSkills, mySkills, ...cleanData } = data as any
        
        updatedRecord = await prisma.companyCareer.update({
          where: { id: ingestResult.id },
          data: {
            title: cleanData.title || 'Untitled Career Opportunity',
            description: cleanData.description,
            level: cleanData.level,
            type: cleanData.type,
            eligibility: cleanData.eligibility ? {
              paygradeRange: cleanData.eligibility.paygradeRange,
              timeInServiceMonths: cleanData.eligibility.timeInServiceMonths,
              timeInPositionMonths: cleanData.eligibility.timeInPositionMonths,
              who: cleanData.eligibility.who,
            } : undefined,
            application: cleanData.application ? {
              instructions: cleanData.application.instructions,
              link: cleanData.application.link,
            } : undefined,
            extras: cleanData.extras ? {
              cost: cleanData.extras.cost,
              notes: cleanData.extras.notes,
            } : undefined,
            summary: cleanData.description || cleanData.title || null,
          },
        })
        break
      }

      case 'event': {
        const data = parsedData as any
        
        updatedRecord = await prisma.companyEvent.update({
          where: { id: ingestResult.id },
          data: {
            title: data.title || 'Untitled Event',
            theme: data.theme,
            description: data.description,
            eventDate: data.eventDate ? new Date(data.eventDate) : null,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
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
          },
        })
        break
      }

      case 'leader_engagement': {
        const data = parsedData as any
        
        updatedRecord = await prisma.companyLeaderEngagement.update({
          where: { id: ingestResult.id },
          data: {
            title: data.title || 'Untitled Leader Engagement',
            description: data.description,
            engagementDate: data.engagementDate ? new Date(data.engagementDate) : null,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            topicAreas: data.topicAreas || [],
            potentialQuestions: data.potentialQuestions || [],
            keyMessages: data.keyMessages || [],
            talkingPoints: data.talkingPoints,
            leaderName: data.leaderName,
            leaderTitle: data.leaderTitle,
            leaderId: data.leaderId,
            audience: data.audience,
            registrationRequired: data.registrationRequired,
            registrationLink: data.registrationLink,
            format: data.format,
            qAndAEnabled: data.qAndAEnabled ?? false,
            pocEmail: data.pocEmail,
            pocPhone: data.pocPhone,
            summary: data.description || data.title || null,
          },
        })
        break
      }

      case 'campaign': {
        const data = parsedData as any
        
        updatedRecord = await prisma.companyCampaign.update({
          where: { id: ingestResult.id },
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
          },
        })
        break
      }

      case 'impact_event': {
        const data = parsedData as any
        
        updatedRecord = await prisma.companyImpactEvent.update({
          where: { id: ingestResult.id },
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
            summary: data.summary || data.description || data.title || null,
          },
        })
        break
      }

      case 'community': {
        const data = parsedData as any
        
        updatedRecord = await prisma.companyCommunity.update({
          where: { id: ingestResult.id },
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
          },
        })
        break
      }

      case 'benefits': {
        const data = parsedData as any
        const updateData: any = {
          title: data.title || 'Untitled Benefits',
          description: data.description,
          employeeBenefitSummary: data.employeeBenefitSummary,
          windowStart: data.windowStart ? new Date(data.windowStart) : null,
          windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
          actionLink: data.actionLink,
          summary: data.description || data.employeeBenefitSummary || data.title || null,
        }
        if (data.deadlines != null) updateData.deadlines = data.deadlines
        if (data.resources != null) updateData.resources = data.resources
        if (data.pocList != null) updateData.pocList = data.pocList
        
        updatedRecord = await prisma.companyBenefits.update({
          where: { id: ingestResult.id },
          data: updateData,
        })
        break
      }

      case 'employee_cause': {
        const data = parsedData as any
        const updateData: any = {
          title: data.title || 'Untitled Employee Cause',
          description: data.description,
          impactSummary: data.impactSummary,
          partnerOrg: data.partnerOrg,
          windowStart: data.windowStart ? new Date(data.windowStart) : null,
          windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
          locations: data.locations || [],
          link: data.link,
          sponsoringDepartment: data.sponsoringDepartment,
          summary: data.description || data.impactSummary || data.title || null,
        }
        if (data.deadlines != null) updateData.deadlines = data.deadlines
        if (data.pocList != null) updateData.pocList = data.pocList
        if (data.extraInstructions != null) updateData.extraInstructions = data.extraInstructions
        
        updatedRecord = await prisma.companyEmployeeCause.update({
          where: { id: ingestResult.id },
          data: updateData,
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
    const redirectTo = `/mycompany/workforcestuff/${routeSegment}/${updatedRecord.id}`

    return NextResponse.json({
      success: true,
      id: updatedRecord.id,
      type,
      redirectTo,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('[Save Workforce Stuff] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save workforce item' },
      { status: 500 }
    )
  }
}


