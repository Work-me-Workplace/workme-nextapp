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

export interface LivingHomageParseResult {
  fullName: string
  role?: string | null
  relation?: string | null
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

    const systemPrompt = `You are implementing ai-living-homage-service.

This service EXTRACTS structured information about living stakeholders who carry forward the legacy of a namesake.

Input:
- Freeform text describing a ship sponsor, memorial honoree, or dedication representative
  (ceremony announcement, press release, dedication speech)

Output:
- A single JSON object matching CompanyPlatformUnitLivingHomage fields
- Null values are allowed when information is not present or cannot be inferred
- Do not invent facts`

    const userPrompt = `Extract structured living homage information from this text.

----------------------------------------
FIELDS TO INFER
----------------------------------------

IDENTITY
- fullName               // REQUIRED - Full name of the living homage (e.g., "Pamela Bove")
- role                   // Role or title (e.g., "Ship Sponsor", "Memorial Honoree")
- relation              // Relationship to namesake if mentioned (e.g., "Granddaughter-in-law of namesake")
- notes                 // Additional context or details

----------------------------------------
EXTRACTION RULES
----------------------------------------
- Extract ONLY factual information explicitly stated in the text
- Focus on living individuals who carry forward the namesake's legacy
- Common roles: Ship Sponsor, Memorial Honoree, Dedication Representative
- Relation field should describe family or historical connection to namesake
- Do NOT invent relationships or roles

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return ONLY valid JSON.

Example output structure:
{
  "fullName": "Pamela Bove",
  "role": "Ship Sponsor",
  "relation": "Granddaughter-in-law of Eugene Bennett Fluckey",
  "notes": "Sponsored USS Barb (SSN-804) at keel laying ceremony on December 9, 2025"
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

    const result: LivingHomageParseResult = {
      fullName: parsed.fullName || '',
      role: parsed.role || null,
      relation: parsed.relation || null,
      notes: parsed.notes || null,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to parse living homage with AI:', error)

    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse living homage' },
      { status: 500 }
    )
  }
}
