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

    const userPrompt = `Analyze this article and return structured intelligence as JSON.

ARTICLE:
${text.substring(0, 6000)}

Return JSON with these fields:

{
  "artifactType": "unit_update" | "milestone" | "workforce" | "leadership" | "industrial_base" | "contract" | "general",
  "aiSummary": "One paragraph (3-5 sentences) factual summary of the article",
  "sentiment": "positive" | "negative" | "neutral",
  "humanElements": {
    "sponsor": "Name of ship sponsor if mentioned (or null)",
    "leaders": ["Array of leadership names mentioned"],
    "attendees": ["Array of other notable attendees/people"],
    "roles": {"person name": "their role/title"}
  },
  "noteworthyItems": {
    "keyFacts": ["Array of 3-5 most important facts"],
    "dates": ["Array of significant dates mentioned (YYYY-MM-DD format)"],
    "milestones": ["Array of milestones mentioned (e.g., 'Keel Laid', 'Sea Trials')"],
    "locations": ["Array of locations mentioned"]
  },
  "leaderStatement": {
    "statement": "The actual quote text (or null if no significant leadership quote)",
    "leader": "Name of person who said it (or null)",
    "role": "Their role/title (or null)"
  }
}

RULES:
- artifactType: Best guess at what this article is primarily about
- aiSummary: Focus on facts, outcomes, and significance
- sentiment: Overall tone (positive = good news, negative = problems/delays, neutral = informational)
- humanElements: Extract all people mentioned with context
- noteworthyItems: What actually matters in this article
- leaderStatement: Only include if there's a meaningful quote from leadership
- Dates should be in YYYY-MM-DD format when possible
- Return null for fields where information is not present

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
        artifactType: parsed.artifactType || 'general',
        aiSummary: parsed.aiSummary || null,
        sentiment: parsed.sentiment || 'neutral',
        humanElements: parsed.humanElements || null,
        noteworthyItems: parsed.noteworthyItems || null,
        leaderStatement: parsed.leaderStatement || null,
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



