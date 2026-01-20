/**
 * POST /api/company/milestones/parse
 * 
 * Parse a CompanyNewsArtifact to extract BIG PICTURE company milestone information
 * Returns preview data - does NOT save to database
 * 
 * CRITICAL: Only extracts company-wide milestones, NOT platform-specific events
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

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
    const { newsArtifactId, rawText } = body

    // Get text from artifact if artifactId provided, otherwise use rawText
    let textToParse = rawText
    let artifact = null

    if (newsArtifactId) {
      artifact = await prisma.companyNewsArtifact.findUnique({
        where: { id: newsArtifactId },
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

      textToParse = artifact.rawText
    }

    if (!textToParse || !textToParse.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/company/milestones/parse]', {
      workMeId,
      companyId,
      newsArtifactId,
      hasRawText: !!rawText,
    })

    // Parse the artifact to extract BIG PICTURE milestone information
    const openai = getOpenAI()
    const systemPrompt = `You are extracting BIG PICTURE company-wide milestone information from news articles and press releases.

CRITICAL FILTERING RULES:
- ONLY extract milestones that are COMPANY-WIDE (entire company does something)
- REJECT platform-specific events (ship commissioning, keel laying, delivery, etc.)
- REJECT unit-specific events (specific ship/submarine milestones)
- ACCEPT: Company-wide reorganizations, major company contracts, strategic initiatives, mergers, acquisitions, company-wide achievements

If the article is about a specific platform unit (ship, submarine, etc.) or platform-specific event, return isBigPictureMilestone: false.

CRITICAL: You MUST ONLY extract information that is explicitly stated in the text. 
DO NOT invent, infer, or guess information that is not present in the text.
DO NOT use training data patterns or defaults.`

    const userPrompt = `Analyze this text and determine if it describes a BIG PICTURE company-wide milestone.

BIG PICTURE MILESTONES are:
- Company-wide reorganizations or restructuring
- Major company-wide contract awards (affecting entire company, not just one platform)
- Company-wide strategic initiatives or launches
- Company mergers or acquisitions
- Company-wide achievements (e.g., "Company reaches 10,000 employees", "Company celebrates 50th anniversary")
- Company-wide policy changes
- Company-wide recognition or awards

NOT BIG PICTURE (REJECT THESE):
- Platform unit events (ship commissioning, keel laying, delivery, etc.)
- Platform-specific milestones
- Unit-specific achievements
- Product launches for specific platforms

Return JSON with these fields:
{
  "isBigPictureMilestone": true or false,
  "reason": "Explanation of why this is or isn't a big picture milestone",
  "title": "Milestone title (only if isBigPictureMilestone is true, otherwise null)",
  "category": "One of: BUSINESS, STRATEGY, ACHIEVEMENT, REORGANIZATION, MERGER, CONTRACT (only if isBigPictureMilestone is true, otherwise null)",
  "milestoneType": "Free-text milestone type (e.g., 'Major Contract Award', 'Strategic Initiative Launch', 'Company Reorganization') (only if isBigPictureMilestone is true, otherwise null)",
  "date": "ISO date YYYY-MM-DD - ONLY if explicitly mentioned in the text. If no date is mentioned, return null. DO NOT invent dates or use article publication dates.",
  "description": "2-3 sentences describing the milestone and its significance (only if isBigPictureMilestone is true, otherwise null)",
  "sourceUrl": "URL of the original news source (if available)"
}

CRITICAL DATE EXTRACTION RULES:
- ONLY extract dates that are explicitly mentioned in the text as the milestone date
- DO NOT use publication dates, article dates, or metadata dates
- DO NOT infer dates from context or training data
- DO NOT invent dates if none are mentioned
- If the text says "today", "yesterday", "next month", etc., return null (these are relative dates)
- If no specific date is mentioned, return null for the date field

Return ONLY valid JSON.

Article Headline: ${artifact?.headline || 'N/A'}
Source: ${artifact?.sourceName || 'N/A'}
URL: ${artifact?.sourceUrl || 'N/A'}

Text:
${textToParse.substring(0, 6000)}`

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

    // If not a big picture milestone, return rejection
    if (!parsed.isBigPictureMilestone) {
      return NextResponse.json({
        success: false,
        isBigPictureMilestone: false,
        reason: parsed.reason || 'This article does not describe a company-wide milestone. It appears to be about a platform-specific or unit-specific event.',
        suggestion: 'For platform-specific events, use the platform update flow instead.',
      }, { status: 400 })
    }

    // Validate required fields for big picture milestones
    if (!parsed.title) {
      return NextResponse.json(
        { success: false, error: 'Could not extract milestone title from article' },
        { status: 400 }
      )
    }

    // Return preview data (not saved yet)
    return NextResponse.json({
      success: true,
      isBigPictureMilestone: true,
      preview: {
        title: parsed.title,
        category: parsed.category || null,
        milestoneType: parsed.milestoneType || null,
        date: parsed.date || null,
        description: parsed.description || null,
        sourceUrl: parsed.sourceUrl || artifact?.sourceUrl || null,
      },
      newsArtifactId: newsArtifactId || null,
    })
  } catch (error: any) {
    console.error('❌ POST /api/company/milestones/parse error:', error)

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse milestone' },
      { status: 500 }
    )
  }
}

