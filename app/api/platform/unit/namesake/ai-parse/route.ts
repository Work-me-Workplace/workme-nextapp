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

export interface NamesakeParseResult {
  fullName: string
  knownAs?: string | null
  role?: string | null
  whyKnown?: string | null
  legacySummary?: string | null
  era?: string | null
  honors?: string[]
  notes?: string | null
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

    const systemPrompt = `You are implementing ai-namesake-service.

This service EXTRACTS structured information about the historical figure or entity for whom a platform unit is named.

Input:
- Freeform text describing a platform unit's namesake
  (Wikipedia article, historical documentation, dedication ceremony, press release)

Output:
- A single JSON object matching CompanyPlatformUnitNamesake fields
- Null values are allowed when information is not present or cannot be inferred
- Do not invent facts`

    const userPrompt = `Extract structured namesake information from this text.

----------------------------------------
FIELDS TO INFER
----------------------------------------

IDENTITY
- fullName               // REQUIRED - Full name of the namesake (e.g., "Eugene Bennett Fluckey")
- knownAs                // Nickname or commonly known name (e.g., "Lucky")
- role                   // Historical role or position (e.g., "WWII Submarine Commander")
- whyKnown               // Factual significance - why this person is remembered
- legacySummary          // Short, factual summary (no prose, just facts)
- era                    // Time period (e.g., "World War II", "Cold War")
- honors                 // Array of awards, medals, recognitions (e.g., ["Medal of Honor", "Navy Cross"])
- notes                  // Additional context or details

----------------------------------------
EXTRACTION RULES
----------------------------------------
- Extract ONLY factual information explicitly stated in the text
- Do NOT invent biographical details
- Do NOT create fictional narratives
- Focus on historical significance and military service
- For honors/awards, only include those explicitly mentioned
- Keep legacySummary concise and factual (2-3 sentences max)

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return ONLY valid JSON.

Example output structure:
{
  "fullName": "Eugene Bennett Fluckey",
  "knownAs": "Lucky",
  "role": "WWII Submarine Commander",
  "whyKnown": "Most decorated submarine commander in US Navy history, sank 29 ships",
  "legacySummary": "Commander of USS Barb (SS-220) during WWII. Awarded Medal of Honor for exceptional leadership and combat success.",
  "era": "World War II",
  "honors": ["Medal of Honor", "Navy Cross", "Distinguished Service Medal"],
  "notes": "Namesake of USS Barb (SSN-804), the 23rd Virginia-class submarine"
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

    // Validate structure
    if (!parsed.fullName) {
      return NextResponse.json(
        { success: false, error: 'Invalid response structure from AI - fullName is required' },
        { status: 500 }
      )
    }

    const result: NamesakeParseResult = {
      fullName: parsed.fullName || '',
      knownAs: parsed.knownAs || null,
      role: parsed.role || null,
      whyKnown: parsed.whyKnown || null,
      legacySummary: parsed.legacySummary || null,
      era: parsed.era || null,
      honors: Array.isArray(parsed.honors) ? parsed.honors : [],
      notes: parsed.notes || null,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to parse namesake with AI:', error)

    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse namesake' },
      { status: 500 }
    )
  }
}
