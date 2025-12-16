/**
 * POST /api/utils/news-artifact/parse
 * 
 * Universal parser for CompanyNewsArtifact
 * Routes to appropriate parser based on modelType
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { parseCompanyXContent } from '@/lib/services/companyx-unified-mapper'
import type { ContextType } from '@/lib/types/context-type'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

type ParseableModelType =
  | 'platform_unit_update'
  | 'platform_unit_statement'
  | 'platform_statement'
  | 'platform_product'
  | 'milestone'
  | 'external_pressure'
  | 'training'
  | 'event'
  | 'career'
  | 'campaign'
  | 'impact_event'
  | 'community'
  | 'benefits'
  | 'employee_cause'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Auth
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
    const { artifactId, modelType, text } = body

    if (!modelType) {
      return NextResponse.json(
        { success: false, error: 'modelType is required' },
        { status: 400 }
      )
    }

    // Get text from artifact if artifactId provided, otherwise use text param
    let rawText = text
    if (artifactId && !text) {
      const artifact = await prisma.companyNewsArtifact.findUnique({
        where: { id: artifactId },
      })

      if (!artifact) {
        return NextResponse.json(
          { success: false, error: 'News artifact not found' },
          { status: 404 }
        )
      }

      if (artifact.companyId !== companyId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        )
      }

      rawText = artifact.rawText
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/utils/news-artifact/parse]', {
      workMeId,
      companyId,
      modelType,
      hasArtifactId: !!artifactId,
      textLength: rawText.length,
    })

    let parsedData: any

    // Route to appropriate parser
    switch (modelType as ParseableModelType) {
      case 'platform_unit_update': {
        const openai = getOpenAI()
        const systemPrompt = `You are implementing ai-platform-unit-update-service. Extract structured update information from articles about a platform unit.`
        const userPrompt = `Extract structured platform unit update information from this text.

FIELDS TO INFER:
- percentComplete (Integer 0-100 if explicitly stated)
- statusUpdate (Current status)
- scheduleNote (Schedule-related information)
- industrialBaseNote (Industrial base issues)
- leadershipQuote (Relevant quote)
- keelLaidDate (ISO date YYYY-MM-DD)
- seaTrialsStartDate (ISO date)
- deliveryDate (ISO date)
- commissioningDate (ISO date)
- narrativeSummary (2-3 sentences)
- tags (Array of relevant tags)

Return ONLY valid JSON.

Text:
${rawText.substring(0, 4000)}`

        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        })

        const parsed = JSON.parse(response.choices[0].message.content || '{}')
        parsedData = {
          percentComplete: typeof parsed.percentComplete === 'number' && parsed.percentComplete >= 0 && parsed.percentComplete <= 100 ? parsed.percentComplete : null,
          statusUpdate: parsed.statusUpdate || null,
          scheduleNote: parsed.scheduleNote || null,
          industrialBaseNote: parsed.industrialBaseNote || null,
          leadershipQuote: parsed.leadershipQuote || null,
          keelLaidDate: parsed.keelLaidDate || null,
          seaTrialsStartDate: parsed.seaTrialsStartDate || null,
          deliveryDate: parsed.deliveryDate || null,
          commissioningDate: parsed.commissioningDate || null,
          narrativeSummary: parsed.narrativeSummary || null,
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        }
        break
      }

      case 'platform_unit_statement': {
        const openai = getOpenAI()
        const systemPrompt = `Extract structured statement information from articles about a platform unit.`
        const userPrompt = `Extract:
- sourceName (publication/organization)
- sourceUrl (if mentioned)
- headline (if present)
- aiSummary (2-3 sentences)
- aiTags (array of tags)

Return ONLY valid JSON.

Text:
${rawText.substring(0, 4000)}`

        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        })

        const parsed = JSON.parse(response.choices[0].message.content || '{}')
        parsedData = {
          sourceName: parsed.sourceName || null,
          sourceUrl: parsed.sourceUrl || null,
          headline: parsed.headline || null,
          aiSummary: parsed.aiSummary || null,
          aiTags: Array.isArray(parsed.aiTags) ? parsed.aiTags : [],
        }
        break
      }

      case 'platform_statement':
      case 'platform_product':
      case 'milestone':
      case 'external_pressure':
        // Basic structures for now - can enhance later
        parsedData = { rawText }
        break

      // CompanyX types
      case 'training':
      case 'event':
      case 'career':
      case 'campaign':
      case 'impact_event':
      case 'community':
      case 'benefits':
      case 'employee_cause': {
        const parsed = await parseCompanyXContent(rawText, modelType as ContextType)
        parsedData = parsed.data
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown model type: ${modelType}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      modelType,
      data: parsedData,
    })
  } catch (error: any) {
    console.error('❌ POST /api/utils/news-artifact/parse error:', error)

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
