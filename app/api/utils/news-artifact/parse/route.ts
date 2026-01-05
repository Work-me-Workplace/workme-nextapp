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
  | 'external_env'
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

      case 'external_env': {
        const openai = getOpenAI()
        const systemPrompt = `You are implementing ai-company-external-env-service.

This service EXTRACTS structured external environment intelligence from articles, reports, or announcements about external signals, factors, and developments affecting a company.

Input:
- Freeform text describing external signals (GAO reports, congressional actions, industry trends, regulatory changes, etc.)

Output:
- A single JSON object matching CompanyExternalEnv fields
- Null values are allowed when information is not present or cannot be inferred
- Do not invent facts`

        const userPrompt = `Extract structured external environment information from this text.

----------------------------------------
FIELDS TO INFER
----------------------------------------

SIGNAL BASICS
- source              // String, required - Where the signal comes from: "GAO", "Congress", "Industry", "DoD", "Navy", etc.
- category            // String, optional - Type of signal: "Budget", "Legislation", "Testing", "Ops", "Regulatory", etc.
- summary             // String, required - Description of the external signal/development (2-4 sentences)
- impact              // String, optional - Why this matters, what it means, significance (1-3 sentences)

CHANGE INTELLIGENCE
- deltaSummary            // String, optional - What materially changed vs prior state (e.g., "New requirement for 12 additional submarines", "Budget cut of $2B")
- implementationTimeline  // String, optional - When this starts to matter (plain language, e.g., "Effective Q2 2026", "Rolls out over next 18 months", "Immediate")
- leadAuthority           // String, optional - Who owns/drives this change (e.g., "Navy Acquisition Office", "House Armed Services Committee", "GAO")

METADATA
- confidenceLevel     // String, optional - One of: "low", "medium", "high" (based on source reliability and specificity)
- timeHorizon         // String, optional - One of: "immediate", "near-term", "long-term" (when this will affect the company)

----------------------------------------
EXTRACTION RULES
----------------------------------------
- Extract ONLY information explicitly stated or clearly inferable from the text
- For deltaSummary: Focus on what changed (new requirements, budget changes, policy shifts, etc.)
- For implementationTimeline: Extract timing information if mentioned (dates, quarters, "immediate", "phased rollout", etc.)
- For leadAuthority: Identify the organization/entity driving this change
- For confidenceLevel: Assess based on source (official releases = "high", industry rumors = "low", etc.)
- For timeHorizon: Infer from timeline information ("immediate" = within 3 months, "near-term" = 3-12 months, "long-term" = 12+ months)
- Do NOT invent facts or dates
- Use null when information is not present

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return ONLY valid JSON.

Example output structure:
{
  "source": "GAO",
  "category": "Budget",
  "summary": "GAO report recommends increased funding for submarine programs, citing industrial base concerns and strategic requirements.",
  "impact": "Could create opportunities for additional contracts and program expansion.",
  "deltaSummary": "New recommendation for $500M additional funding above current budget request",
  "implementationTimeline": "If approved, would take effect in FY2027 budget cycle",
  "leadAuthority": "GAO Defense Capabilities and Management team",
  "confidenceLevel": "high",
  "timeHorizon": "near-term"
}

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
        
        // Validate confidenceLevel and timeHorizon enums
        const validConfidenceLevels = ['low', 'medium', 'high']
        const validTimeHorizons = ['immediate', 'near-term', 'long-term']
        
        parsedData = {
          source: parsed.source || 'Unknown',
          category: parsed.category || null,
          summary: parsed.summary || rawText.substring(0, 500), // Fallback to first 500 chars
          impact: parsed.impact || null,
          deltaSummary: parsed.deltaSummary || null,
          implementationTimeline: parsed.implementationTimeline || null,
          leadAuthority: parsed.leadAuthority || null,
          confidenceLevel: parsed.confidenceLevel && validConfidenceLevels.includes(parsed.confidenceLevel.toLowerCase()) 
            ? parsed.confidenceLevel.toLowerCase() 
            : null,
          timeHorizon: parsed.timeHorizon && validTimeHorizons.includes(parsed.timeHorizon.toLowerCase())
            ? parsed.timeHorizon.toLowerCase()
            : null,
        }
        break
      }

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
