import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Initialize OpenAI client
let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

/**
 * POST /api/highlights/parse
 * 
 * AI parser that extracts structured fields from citation text
 * Returns parsed data without saving to database
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    await verifyAuth(request as Request)

    // 2. Parse request body
    const body = await request.json()
    const { citationText } = body

    if (!citationText || typeof citationText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'citationText is required' },
        { status: 400 }
      )
    }

    // 3. Build system prompt
    const systemPrompt = `You are an expert at parsing employee award citations, recognition writeups, and highlight text.

Extract the following information from the citation text:
- fullName: The employee's full name (or null if not found)
- title: Their job title or position (or null if not found)
- unit: Their company unit (e.g., "SEA05", "SEA08", "NAVSEA HQ") (or null if not found)
- awardName: The name of the award (or null if not found)
- awardingAgency: The organization/agency giving the award (or null if not found)
- awardYear: The year of the award as a number (or null if not found)
- achievement: A one-sentence summary of what they achieved (or null if not found)
- classification: The type/category of recognition (e.g., "Leadership", "Innovation", "Excellence") (or null if not found)

Return ONLY a JSON object with these exact fields. Use null for any field that cannot be determined from the text.

Example response:
{
  "fullName": "John Smith",
  "title": "Senior Engineer",
  "unit": "SEA05",
  "awardName": "Rosenblatt Young Naval Engineer Award",
  "awardingAgency": "American Society of Naval Engineers",
  "awardYear": 2024,
  "achievement": "Led development of innovative propulsion system",
  "classification": "Innovation"
}`

    // 4. Call OpenAI
    const openai = getOpenAIClient()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    console.log('[API POST /api/highlights/parse] Calling OpenAI', {
      model,
      citationTextLength: citationText.length,
    })

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0, // Deterministic parsing
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Parse this citation text:\n\n${citationText}`,
        },
      ],
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('No GPT output received')
    }

    // 5. Parse JSON response
    let parsedData: any
    try {
      parsedData = JSON.parse(content)
    } catch (parseError) {
      console.error('[API POST /api/highlights/parse] JSON parse error:', parseError)
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI')
      }
    }

    // 6. Validate and normalize response
    const result = {
      fullName: parsedData.fullName || null,
      title: parsedData.title || null,
      unit: parsedData.unit || null,
      awardName: parsedData.awardName || null,
      awardingAgency: parsedData.awardingAgency || null,
      awardYear: parsedData.awardYear ? parseInt(String(parsedData.awardYear)) : null,
      achievement: parsedData.achievement || null,
      classification: parsedData.classification || null,
    }

    console.log('[API POST /api/highlights/parse] Success', {
      extractedFields: Object.keys(result).filter(k => result[k as keyof typeof result] !== null),
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('[API POST /api/highlights/parse] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to parse citation',
      },
      { status: 500 }
    )
  }
}

