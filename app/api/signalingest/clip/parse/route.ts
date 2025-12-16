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

    // Step 1: Infer type from article content
    // First try to detect external company models (pressure, milestone, platform product)
    // If not detected, use CompanyX inference
    let inferredType: string
    let parsed: any
    let isExternalModel = false

    // Simple keyword-based detection for external models
    const lowerText = rawText.toLowerCase()
    
    // Check for platform/product keywords (submarine, ship, vessel, platform, class, etc.)
    const platformKeywords = [
      'submarine', 'ship', 'vessel', 'platform', 'class', 'ssn', 'ssbn', 'cvn', 'ddg', 
      'virginia-class', 'columbia-class', 'ford-class', 'arleigh burke', 'shipyard',
      'keel', 'hull', 'delivery', 'commissioning', 'sea trials', 'construction'
    ]
    
    if (platformKeywords.some(keyword => lowerText.includes(keyword))) {
      // Likely CompanyPlatformStatement (needs platformProductId - will need user to select)
      inferredType = 'platform_product'
      isExternalModel = true
      parsed = { 
        type: 'platform_product', 
        data: { 
          title: title || 'Platform News',
          rawText,
          sourceUrl: url,
          sourceName: source
        } 
      }
    } else if (
      lowerText.includes('pressure') ||
      lowerText.includes('criticism') ||
      lowerText.includes('challenge') ||
      lowerText.includes('opposition') ||
      lowerText.includes('external') ||
      lowerText.includes('congress') ||
      lowerText.includes('budget cut') ||
      lowerText.includes('funding') ||
      lowerText.includes('appropriations')
    ) {
      // Likely ExternalCompanyPressure
      inferredType = 'external_pressure'
      isExternalModel = true
      parsed = { type: 'external_pressure', data: { summary: rawText, source: source || url || 'Unknown' } }
    } else if (
      lowerText.includes('milestone') ||
      lowerText.includes('keel laying') ||
      lowerText.includes('keel laid') ||
      lowerText.includes('launch') ||
      lowerText.includes('christening')
    ) {
      // Likely CompanyMilestone
      inferredType = 'milestone'
      isExternalModel = true
      parsed = { type: 'milestone', data: { title: title || 'Milestone', description: rawText, sourceUrl: url } }
    } else {
      // Use CompanyX inference
      const inference = await inferCompanyXType(rawText)
      inferredType = inference.type
      parsed = await parseCompanyXContent(rawText, inferredType as ContextType)
    }

    // Step 3: Create record (CompanyX, ExternalCompanyPressure, or CompanyMilestone)
    const modelName = isExternalModel ? inferredType : CONTEXT_TYPE_TO_MODEL[inferredType as ContextType]
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
            windowStart: data.startDate ? new Date(data.startDate) : null,
            windowEnd: data.endDate ? new Date(data.endDate) : null,
            ctaLink: data.link || url || null,
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
            effectiveDate: data.eventDate ? new Date(data.eventDate) : null,
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
            signUpLink: data.link || url || null,
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
            actionLink: data.link || url || null,
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
        // Handle external company models
        if (inferredType === 'external_pressure') {
          // ExternalCompanyPressure requires workMeId, not companyId
          // Use title + snippet as summary, or fallback to truncated rawText
          const summaryText = title && snippet 
            ? `${title}\n\n${snippet}` 
            : (title || snippet || rawText.substring(0, 500))
          
          createdRecord = await prisma.externalCompanyPressure.create({
            data: {
              workMeId,
              source: parsed.data.source || source || url || 'Unknown',
              summary: summaryText,
              category: null, // Could be inferred in the future
              impact: null,
            },
          })
          break
        } else if (inferredType === 'milestone') {
          // CompanyMilestone requires companyId
          if (!companyId) {
            return NextResponse.json(
              { success: false, error: 'companyId is required for milestones' },
              { status: 400 }
            )
          }
          createdRecord = await prisma.companyMilestone.create({
            data: {
              companyId,
              title: parsed.data.title || title || 'Company Milestone',
              description: parsed.data.description || snippet || rawText.substring(0, 1000),
              sourceUrl: parsed.data.sourceUrl || url || null,
              category: 'Platform', // Default, could be inferred
              milestoneType: null, // Could be inferred from keywords
              date: date ? new Date(date) : null,
            },
          })
          break
        } else if (inferredType === 'platform_product') {
          // CompanyPlatformStatement - requires platformProductId
          // For articles detected as platform/product related, users should use
          // the platform product detail pages which have the ingest flow
          return NextResponse.json(
            { 
              success: false, 
              error: 'Platform/product articles need to be ingested via the platform product pages where you can select the specific platform. Detected as: platform/product article.',
              inferredType: 'platform_product',
              suggestion: 'Navigate to the platform product page and use the article ingest feature there.'
            },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { success: false, error: `Unsupported type: ${parsed.type || inferredType}` },
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

