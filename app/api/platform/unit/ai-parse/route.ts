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

export interface UnitParseResult {
  hullNumber: string
  name?: string | null
  platformClass?: string | null
  numberInClass?: number | null
  defenseContractor?: string | null
  shipyard?: string | null
  whereBuilt?: string | null
  unitCost?: string | null
  constructionStartDate?: string | null
  constructionCompleteDate?: string | null
  deliveryToFleetDate?: string | null
  commissioningDate?: string | null
  homeport?: string | null
  currentStatus?: string | null
  percentComplete?: number | null
  createdVia: 'AI_INGEST'
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

    const systemPrompt = `You are implementing ai-platformunit-service.

This service does NOT summarize.
It EXTRACTS and INFERS structured, authoritative unit-level data.

Input:
- Freeform text describing a specific military platform unit
  (Wikipedia article, DoD release, shipyard announcement, news article)

Output:
- A single JSON object matching CompanyPlatformUnit inference fields
- Null values are allowed when information is not present or cannot be inferred
- Do not invent facts`

    const userPrompt = `Extract structured platform unit information from this text.

----------------------------------------
FIELDS TO INFER (UNIT-LEVEL ONLY)
----------------------------------------

IDENTITY
- hullNumber               // e.g., "SSN-804"
- name                     // e.g., "Barb"
- platformClass            // e.g., "Virginia-class"
- numberInClass             // ordinal if explicitly stated (e.g., "23rd submarine")
- createdVia = "AI_INGEST"

INDUSTRIAL / BUILD CONTEXT
- defenseContractor        // e.g., "General Dynamics Electric Boat"
- shipyard                 // e.g., "HII Newport News"
- whereBuilt               // city/state if available
- unitCost                 // cost range if explicitly stated

LIFECYCLE DATES (AUTHORITATIVE STATES)
- constructionStartDate    // laid down date
- constructionCompleteDate // if explicitly stated
- deliveryToFleetDate      // delivered to Navy / fleet
- commissioningDate        // commissioned date

OPERATIONAL CONTEXT
- homeport                 // if stated
- currentStatus            // inferred if explicitly stated (e.g., "decommissioned", "under construction")
- percentComplete          // ONLY if explicitly stated as a percentage

----------------------------------------
DO NOT INFER / DO NOT GUESS
----------------------------------------
- Do NOT infer milestones beyond what is explicitly stated
- Do NOT invent ordinals or costs
- Do NOT infer human roles (namesake, sponsor, homage)
- Do NOT summarize combat history or missions
- Do NOT create milestones or updates

----------------------------------------
NORMALIZATION RULES
----------------------------------------
- Dates must be ISO-8601 (YYYY-MM-DD) when possible
- Percent values must be integers (0–100)
- Use null when uncertain
- Prefer primary sources (Wikipedia intro table, shipyard statements)

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return ONLY valid JSON.

Example output structure:
{
  "hullNumber": "SS-220",
  "name": "Barb",
  "platformClass": "Gato-class",
  "numberInClass": null,
  "defenseContractor": "Electric Boat Company",
  "shipyard": "Electric Boat, Groton, Connecticut",
  "whereBuilt": "Groton, CT",
  "unitCost": null,
  "constructionStartDate": "1941-06-09",
  "constructionCompleteDate": null,
  "deliveryToFleetDate": null,
  "commissioningDate": "1942-07-08",
  "homeport": null,
  "currentStatus": "Decommissioned",
  "percentComplete": null,
  "createdVia": "AI_INGEST"
}

----------------------------------------
IMPORTANT
----------------------------------------
This service ONLY populates CompanyPlatformUnit core fields.
Milestones, namesake, living homage, statements, and updates
are handled by downstream services.

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
    if (!parsed.hullNumber) {
      return NextResponse.json(
        { success: false, error: 'Invalid response structure from AI - hullNumber is required' },
        { status: 500 }
      )
    }

    const result: UnitParseResult = {
      hullNumber: parsed.hullNumber || '',
      name: parsed.name || null,
      platformClass: parsed.platformClass || null,
      numberInClass: parsed.numberInClass ? parseInt(parsed.numberInClass) : null,
      defenseContractor: parsed.defenseContractor || null,
      shipyard: parsed.shipyard || null,
      whereBuilt: parsed.whereBuilt || null,
      unitCost: parsed.unitCost || null,
      constructionStartDate: parsed.constructionStartDate || null,
      constructionCompleteDate: parsed.constructionCompleteDate || null,
      deliveryToFleetDate: parsed.deliveryToFleetDate || null,
      commissioningDate: parsed.commissioningDate || null,
      homeport: parsed.homeport || null,
      currentStatus: parsed.currentStatus || null,
      percentComplete:
        typeof parsed.percentComplete === 'number' &&
        parsed.percentComplete >= 0 &&
        parsed.percentComplete <= 100
          ? parsed.percentComplete
          : null,
      createdVia: 'AI_INGEST',
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to parse platform unit with AI:', error)

    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse platform unit' },
      { status: 500 }
    )
  }
}
