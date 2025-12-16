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

export interface StatementParseResult {
  sourceName?: string | null
  sourceUrl?: string | null
  headline?: string | null
  rawText: string
  aiSummary?: string | null
  aiTags?: string[]
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

    const systemPrompt = `You are implementing ai-platform-unit-statement-service.

This service EXTRACTS structured information from articles, press releases, or statements about a platform unit.

Input:
- Freeform text (article, press release, news item, statement)

Output:
- A single JSON object matching CompanyPlatformUnitStatement fields
- Extracts metadata (source, headline, summary, tags) from the raw text
- Preserves the full raw text`

    const userPrompt = `Extract structured statement information from this text.

----------------------------------------
FIELDS TO INFER
----------------------------------------

METADATA
- sourceName             // Source publication or organization (e.g., "USNI News", "HII Release")
- sourceUrl              // URL if mentioned in text
- headline               // Article headline or title if present

AI-GENERATED
- aiSummary              // AI-generated summary (2-3 sentences)
- aiTags                 // Array of relevant tags (e.g., ["milestone", "schedule", "industrial base", "leadership"])

NOTE: The rawText field will be automatically set to the input text - do not include it in your response.

----------------------------------------
EXTRACTION RULES
----------------------------------------
- Preserve the full rawText (use the input text as-is)
- Extract source name if mentioned (publication, organization, etc.)
- Extract headline if present at the beginning of the text
- Generate a concise summary (2-3 sentences)
- Tags should be relevant keywords that categorize the content
- Common tags: milestone, schedule, cost, industrial base, leadership, construction, delivery, commissioning

----------------------------------------
OUTPUT FORMAT
----------------------------------------
Return ONLY valid JSON.

Example output structure:
{
  "sourceName": "USNI News",
  "sourceUrl": "https://news.usni.org/2025/12/09/keel-laid-for-uss-barb",
  "headline": "Keel Laid for USS Barb (SSN-804)",
  "aiSummary": "Keel laying ceremony held for USS Barb (SSN-804) at Newport News Shipbuilding. Construction is 60% complete and on track for 2027 delivery. Ship sponsor Pamela Bove, granddaughter-in-law of namesake Eugene Fluckey, participated in the ceremony.",
  "aiTags": ["milestone", "schedule", "construction", "ceremony"]
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

    // No validation needed for rawText - we always use the input text

    const result: StatementParseResult = {
      sourceName: parsed.sourceName || null,
      sourceUrl: parsed.sourceUrl || null,
      headline: parsed.headline || null,
      rawText: text, // Always use the original input text
      aiSummary: parsed.aiSummary || null,
      aiTags: Array.isArray(parsed.aiTags) ? parsed.aiTags : [],
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to parse statement with AI:', error)

    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse statement' },
      { status: 500 }
    )
  }
}
