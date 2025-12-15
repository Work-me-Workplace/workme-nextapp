/**
 * POST /api/signalingest/clip/parse
 * 
 * Clip Parse Signal - Ingest article from search results
 * 
 * Flow:
 * 1. User clicks "Ingest Article" on a search result
 * 2. System infers CompanyX type from article content
 * 3. System parses content using appropriate mapper
 * 4. Creates CompanyX record
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { inferCompanyXType } from '@/lib/services/companyx-topic-inference'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import { CONTEXT_TYPE_TO_MODEL } from '@/lib/services/companyx-mapper'
import type { ContextType } from '@/lib/types/context-type'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 1. Auth - Verify Firebase token
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated or companyId not set' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, url, snippet, source, date } = body

    // Build article content from available fields
    // Use title + snippet as the raw text to parse
    const rawText = [title, snippet].filter(Boolean).join('\n\n')

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Article content (title and/or snippet) is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/signalingest/clip/parse]', {
      workMeId,
      companyId,
      url,
      hasTitle: !!title,
      hasSnippet: !!snippet,
    })

    // Step 1: Infer CompanyX type from article content
    const inference = await inferCompanyXType(rawText)
    const inferredType: ContextType = inference.type

    // Step 2: Parse content using appropriate mapper
    const parsed = await parseCompanyXContent(rawText, inferredType)

    // Step 3: Create CompanyX record
    const modelName = CONTEXT_TYPE_TO_MODEL[inferredType]
    let createdRecord: any

    // Use the same creation logic as workforcestuff/add
    switch (parsed.type) {
      case 'training': {
        const data = parsed.data
        createdRecord = await prisma.companyTraining.create({
          data: {
            title: data.title || title || 'Untitled Training',
            description: data.description,
            topic: data.topic,
            mandatory: data.mandatory,
            sponsoringOffice: data.sponsoringOffice,
            trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            format: data.format,
            link: data.link || url || null,
            pocFirstName: data.poc.name ? data.poc.name.split(' ')[0] : null,
            pocLastName: data.poc.name ? data.poc.name.split(' ').slice(1).join(' ') : null,
            pocEmail: data.poc.email,
            pocPhone: data.poc.phone,
            pocRankOrTitle: data.poc.rankOrTitle,
            ingestRawText: rawText,
            summary: data.description || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'career': {
        const data = parsed.data
        createdRecord = await prisma.companyCareer.create({
          data: {
            title: data.title || title || 'Untitled Career Opportunity',
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
              link: data.application.link || url || null,
            },
            extras: {
              cost: data.extras.cost,
              notes: data.extras.notes,
            },
            ingestRawText: rawText,
            summary: data.description || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'event': {
        const data = parsed.data
        createdRecord = await prisma.companyEvent.create({
          data: {
            title: data.title || title || 'Untitled Event',
            theme: data.theme,
            description: data.description,
            eventDate: data.eventDate ? new Date(data.eventDate) : null,
            startTime: data.startTime,
            endTime: data.endTime,
            eventCategory: data.eventCategory,
            registrationRequired: data.registrationRequired,
            registrationLink: data.registrationLink || url || null,
            audience: data.audience,
            vibe: data.vibe,
            perks: data.perks || [],
            participation: data.participation || [],
            foodProvided: data.foodProvided,
            foodTypes: data.foodTypes,
            speakers: data.speakers || [],
            pocEmail: data.pocEmail,
            pocPhone: data.pocPhone,
            ingestRawText: rawText,
            summary: data.description || data.theme || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'campaign': {
        const data = parsed.data
        createdRecord = await prisma.companyCampaign.create({
          data: {
            title: data.title || title || 'Untitled Campaign',
            description: data.description,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            link: data.link || url || null,
            ingestRawText: rawText,
            summary: data.description || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'impact_event': {
        const data = parsed.data
        createdRecord = await prisma.companyImpactEvent.create({
          data: {
            title: data.title || title || 'Untitled Impact Event',
            description: data.description,
            eventDate: data.eventDate ? new Date(data.eventDate) : null,
            link: data.link || url || null,
            ingestRawText: rawText,
            summary: data.description || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'community': {
        const data = parsed.data
        createdRecord = await prisma.companyCommunity.create({
          data: {
            title: data.title || title || 'Untitled Community',
            description: data.description,
            link: data.link || url || null,
            ingestRawText: rawText,
            summary: data.description || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'benefits': {
        const data = parsed.data
        createdRecord = await prisma.companyBenefits.create({
          data: {
            title: data.title || title || 'Untitled Benefit',
            description: data.description,
            link: data.link || url || null,
            ingestRawText: rawText,
            summary: data.description || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      case 'employee_cause': {
        const data = parsed.data
        createdRecord = await prisma.companyEmployeeCause.create({
          data: {
            title: data.title || title || 'Untitled Employee Cause',
            description: data.description,
            link: data.link || url || null,
            ingestRawText: rawText,
            summary: data.description || data.title || title || null,
            companyId,
            createdByWorkMeId: workMeId,
          },
        })
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported type: ${parsed.type}` },
          { status: 400 }
        )
    }

    console.log('[API POST /api/signalingest/clip/parse] SUCCESS', {
      workMeId,
      inferredType,
      recordId: createdRecord.id,
      modelName,
    })

    return NextResponse.json({
      success: true,
      inferredType,
      record: {
        id: createdRecord.id,
        type: inferredType,
        title: createdRecord.title,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/signalingest/clip/parse error:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse article' },
      { status: 500 }
    )
  }
}

