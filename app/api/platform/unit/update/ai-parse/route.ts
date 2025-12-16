import { NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface UpdateParseResult {
  percentComplete?: number | null
  statusUpdate?: string | null
  scheduleNote?: string | null
  industrialBaseNote?: string | null
  leadershipQuote?: string | null
  keelLaidDate?: string | null
  seaTrialsStartDate?: string | null
  deliveryDate?: string | null
  commissioningDate?: string | null
  narrativeSummary?: string | null
  tags?: string[]
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    const openai = getOpenAI()

    const systemPrompt = `You are implementing ai-platform-unit-update-service.

This service EXTRACTS structured update information from articles, press releases, or status reports about a platform unit.

Input:
- Freeform text describing unit status, progress, milestones, or updates
  (news article, DoD release, shipyard announcement, status report)

Output:
- A single JSON object matching CompanyPlatformUnitUpdate fields
- Null values are allowed when information is not present or cannot be inferred
- Do not invent facts`

    const userPrompt = `Extract structured platform unit update information from this text.

----------------------------------------
FIELDS TO INFER
----------------------------------------

PROGRESS & STATUS
- percentComplete        // Integer 0-100 if explicitly stated as percentage
- statusUpdate           // Current status (e.g., "Keel Laid", "Construction 60% complete", "Sea Trials")
- scheduleNote           // Schedule-related information (delays, ahead of schedule, etc.)
- industrialBaseNote     // Industrial base issues (labor shortages, supplier delays, etc.)
- leadershipQuote        // Relevant quote from leadership if present

MILESTONE DATES
- keelLaidDate           // ISO date (YYYY-MM-DD) if keel laying mentioned
- seaTrialsStartDate     // ISO date (YYYY-MM-DD) if sea trials start mentioned
- deliveryDate           // ISO date (YYYY-MM-DD) if delivery mentioned
- commissioningDate      // ISO date (YYYY-MM-DD) if commissioning mentioned

NARRATIVE & TAGS
- narrativeSummary       // AI-generated summary of the update (2-3 sentences)
- tags                   // Array of relevant tags (e.g., ["schedule", "milestone", "industrial base"])

----------------------------------------
EXTRACTION RULES
----------------------------------------
- Extract ONLY information explicitly stated in the text
- For dates, use ISO format (YYYY-MM-DD) when possible
- Percent complete should be integer 0-100, only if explicitly stated
- Status update should reflect current state mentioned in text
- Tags should be relevant keywords (schedule, cost, milestone, industrial base, leadership, etc.)
- Do NOT invent dates or percentages
- Do NOT create milestones - only extract dates if mentioned

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return ONLY valid JSON.

Example output structure:
{
  "percentComplete": 60,
  "statusUpdate": "Construction 60% complete",
  "scheduleNote": "On track for 2027 delivery",
  "industrialBaseNote": null,
  "leadershipQuote": "This represents a significant milestone in our shipbuilding program",
  "keelLaidDate": "2025-12-09",
  "seaTrialsStartDate": null,
  "deliveryDate": null,
  "commissioningDate": null,
  "narrativeSummary": "Keel laying ceremony held for USS Barb (SSN-804). Construction is 60% complete and on track for 2027 delivery.",
  "tags": ["milestone", "schedule", "construction"]
}

Text:
${text.substring(0, 4000)}`

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

    const result: UpdateParseResult = {
      percentComplete:
        typeof parsed.percentComplete === 'number' &&
        parsed.percentComplete >= 0 &&
        parsed.percentComplete <= 100
          ? parsed.percentComplete
          : null,
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

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to parse update with AI:', error)

    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse update' },
      { status: 500 }
    )
  }
}
