/**
 * POST /api/utils/news-artifact/ingest
 * 
 * Comprehensive article ingestion service that analyzes and structures news articles
 * 
 * Steps:
 * 1. Determine artifact type (unit update, milestone, workforce, etc.)
 * 2. Generate AI summary (one paragraph)
 * 3. Extract human elements (sponsors, leaders, attendees)
 * 4. Identify noteworthy items (key facts, dates, milestones)
 * 5. Parse leader statements (if any)
 * 6. Determine sentiment (positive, negative, neutral)
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export const dynamic = 'force-dynamic'

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
    const { text, headline, sourceUrl, sourceName } = body

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/utils/news-artifact/ingest] Processing article...')

    const openai = getOpenAI()

    const systemPrompt = `You are an article intelligence analyzer for a company news system.

Your job is to deeply analyze news articles and extract structured intelligence for downstream processing.

You will extract:
1. Artifact type (what is this about?)
2. One paragraph summary
3. Human elements (people mentioned)
4. Noteworthy items (key facts, dates, milestones)
5. Leader statements (quotes from leadership)
6. Sentiment analysis

Be precise and factual. Do not invent information.`

    const userPrompt = `Analyze this article about a platform unit and extract data that maps DIRECTLY to CompanyPlatformUnitUpdate model fields.

ARTICLE:
${text.substring(0, 6000)}

Return JSON with these fields that map to CompanyPlatformUnitUpdate:

{
  "statusUpdate": "Current status update string (e.g., 'Builder's Trials', 'Sea Trials', 'Keel Laid', 'Construction 60% complete', 'Under Construction') or null",
  "percentComplete": "Construction/progress percentage (0-100 integer) if mentioned, or null",
  "scheduleNote": "Schedule-related note if mentioned (e.g., 'Delivery delayed from July 2025 to March 2027', 'On schedule', 'Ahead of schedule') or null",
  "industrialBaseNote": "Industrial base issues if mentioned (e.g., 'Labor shortage', 'supplier delays', 'material constraints', 'technology integration challenges') or null",
  "leadershipQuote": "Relevant quote from leadership or key personnel (actual quote text) or null",
  "keelLaidDate": "Keel laid date in YYYY-MM-DD format if mentioned, or null",
  "seaTrialsStartDate": "Sea trials start date in YYYY-MM-DD format if mentioned, or null",
  "deliveryDate": "Delivery date in YYYY-MM-DD format if mentioned, or null",
  "commissioningDate": "Commissioning date in YYYY-MM-DD format if mentioned, or null",
  "narrativeSummary": "2-3 sentence factual summary of what this update reports",
  "tags": ["Array of relevant tags", "e.g.", "builder's trials", "delivery", "schedule", "sea trials"]
}

ADDITIONAL METADATA (for news artifact, not update model):
{
  "artifactType": "unit_update" | "milestone" | "workforce" | "leadership" | "industrial_base" | "contract" | "general",
  "sentiment": "positive" | "negative" | "neutral",
  "articleStyle": "factual_reporting" | "inferred_fault" | "capability_highlight" | "mixed",
  "humanElements": {
    "sponsor": "Name of ship sponsor if mentioned (or null)",
    "leaders": ["Array of ACTUAL leadership names - CEOs, Admirals, Program Managers, Senior Executives ONLY. NOT spokespeople"],
    "spokespeople": ["Array of spokespeople, PR representatives, media contacts, or public affairs officers mentioned"]
  }
}

CRITICAL RULES - Map to CompanyPlatformUnitUpdate fields:
- statusUpdate: Current status of the unit (e.g., "Builder's Trials", "Sea Trials", "Keel Laid"). This is what's happening NOW.
- percentComplete: Only if article mentions a specific percentage (0-100 integer)
- scheduleNote: Schedule-related information (delays, on-time, ahead, etc.)
- industrialBaseNote: Industrial base, supply chain, or technical challenges mentioned
- leadershipQuote: Actual quote text from leadership (not spokespeople)
- keelLaidDate, seaTrialsStartDate, deliveryDate, commissioningDate: Extract dates ONLY if explicitly mentioned in YYYY-MM-DD format
- narrativeSummary: Brief factual summary (2-3 sentences)
- tags: Relevant tags for filtering/searching

For your JFK article example:
- statusUpdate: "Builder's Trials"
- seaTrialsStartDate: "2026-01-28"
- deliveryDate: "2027-03-01" (March 2027)
- scheduleNote: "Delivery delayed from July 2025 to March 2027 due to new technology integration"
- narrativeSummary: "USS John F. Kennedy (CVN-79) departed for builder's trials on January 28, 2026. Delivery scheduled for March 2027, delayed from original July 2025 date to incorporate F-35C and Enterprise Air Surveillance Radar capabilities."

Return ONLY valid JSON.`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    console.log('[API POST /api/utils/news-artifact/ingest] Analysis complete:', {
      artifactType: parsed.artifactType,
      sentiment: parsed.sentiment,
      hasLeaderStatement: !!parsed.leaderStatement?.statement,
    })

    return NextResponse.json({
      success: true,
      data: {
        // Artifact metadata (for CompanyNewsArtifact)
        artifactType: parsed.artifactType || 'general',
        sentiment: parsed.sentiment || 'neutral',
        articleStyle: parsed.articleStyle || 'factual_reporting',
        humanElements: parsed.humanElements || null,
        noteworthyItems: parsed.noteworthyItems || null,
        leaderStatement: parsed.leaderStatement || null,
        narrativeSummary: parsed.narrativeSummary || null,
        
        // CompanyPlatformUnitUpdate fields (if artifactType is unit_update)
        // These are extracted but artifact is saved globally first
        statusUpdate: parsed.statusUpdate || null,
        percentComplete: parsed.percentComplete || null,
        scheduleNote: parsed.scheduleNote || null,
        industrialBaseNote: parsed.industrialBaseNote || null,
        leadershipQuote: parsed.leadershipQuote || null,
        keelLaidDate: parsed.keelLaidDate || null,
        seaTrialsStartDate: parsed.seaTrialsStartDate || null,
        deliveryDate: parsed.deliveryDate || null,
        commissioningDate: parsed.commissioningDate || null,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        
        // Include original metadata for saving
        rawText: text,
        headline: headline || null,
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/utils/news-artifact/ingest error:', error)

    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process article' },
      { status: 500 }
    )
  }
}



