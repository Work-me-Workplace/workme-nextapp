import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import OpenAI from 'openai'

// Force dynamic rendering
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

interface PromotionalIngestionRequest {
  type: string
  rawText: string
}

interface PromotionalIngestionResponse {
  success: true
  data: {
    name: string
    type: string
    title: string | null
    headline: string | null
    subheadline: string | null
    details: string | null
    perks: string | null
    participation: string | null
    foodProvided: string | null
    foodTypes: string | null
    theme: string | null
    eventDateBlock: string | null
    eventTimeBlock: string | null
    rsvpLink: string | null
    metadata: Record<string, any> | null
  }
}

interface PromotionalIngestionError {
  success: false
  error: string
}

/**
 * POST /api/ingest/promotional/ai
 * AI ingestion endpoint for parsing event details into CVI-ready promotional product brief
 * 
 * Body: { type: string, rawText: string }
 * Returns: { success: true, data: {...} } or { success: false, error: "..." }
 * 
 * Does NOT save to database - this is a pure parsing endpoint
 */
export async function POST(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyUnit, companyDivision } = await verifyAuth(request)

    console.log('[API POST /api/ingest/promotional/ai]', {
      workMeId,
      companyUnit,
      companyDivision,
    })

    const body: PromotionalIngestionRequest = await request.json()
    const { type, rawText } = body

    if (!rawText || !rawText.trim()) {
      return NextResponse.json<PromotionalIngestionError>(
        { success: false, error: 'rawText is required' },
        { status: 400 },
      )
    }

    if (!type || !type.trim()) {
      return NextResponse.json<PromotionalIngestionError>(
        { success: false, error: 'type is required' },
        { status: 400 },
      )
    }

    // Build system prompt (exact as specified)
    const systemPrompt = `You convert event details into a CVI-ready promotional product brief.

Extract and format:
- title: Event title in ALL CAPS (e.g., "HOLIDAY OPEN HOUSE")
- headline: Main headline
- subheadline: Supporting headline
- details: Event description and details
- perks: List of perks or benefits (as a single string)
- participation: How to participate or what to expect (as a single string)
- foodProvided: "Yes" or "No"
- foodTypes: Types of food (e.g., "Lunch, snacks, beverages")
- theme: Event theme or tagline
- eventDateBlock: Formatted date (e.g., "Wednesday, December 17")
- eventTimeBlock: Formatted time range (e.g., "11:30 a.m. – 1:30 p.m.")
- rsvpLink: Always null (user fills manually)

Return ONLY:

{
  "title": "",
  "headline": "",
  "subheadline": "",
  "details": "",
  "perks": "",
  "participation": "",
  "foodProvided": "",
  "foodTypes": "",
  "theme": "",
  "eventDateBlock": "",
  "eventTimeBlock": "",
  "rsvpLink": null
}

Never return IDs. Do NOT attempt QR code generation.`

    // Build user prompt
    const userPrompt = `Create a promotional product brief for type: ${type}

Event details:
${rawText}

Generate a CVI-ready structure with appropriate text blocks for this promotional product type.`

    // Call OpenAI
    const openai = getOpenAIClient()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    console.log('[API POST /api/ingest/promotional/ai] Calling OpenAI', {
      model,
      type,
      rawTextLength: rawText.length,
    })

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0, // Deterministic parsing
      response_format: { type: 'json_object' }, // JSON-only output
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
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('No GPT output received')
    }

    // Parse JSON response
    let parsedData: any
    try {
      parsedData = JSON.parse(content)
    } catch (parseError) {
      console.error('[API POST /api/ingest/promotional/ai] JSON parse error:', parseError)
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI')
      }
    }

    // Normalize the response
    const response: PromotionalIngestionResponse = {
      success: true,
      data: {
        name: parsedData.name || 'Untitled Product',
        type: parsedData.type || type,
        title: parsedData.title || null,
        headline: parsedData.headline || null,
        subheadline: parsedData.subheadline || null,
        details: parsedData.details || null,
        perks: parsedData.perks || null,
        participation: parsedData.participation || null,
        foodProvided: parsedData.foodProvided || null,
        foodTypes: parsedData.foodTypes || null,
        theme: parsedData.theme || null,
        eventDateBlock: parsedData.eventDateBlock || null,
        eventTimeBlock: parsedData.eventTimeBlock || null,
        rsvpLink: parsedData.rsvpLink || null,
        metadata: parsedData.metadata && typeof parsedData.metadata === 'object' ? parsedData.metadata : null,
      },
    }

    console.log('[API POST /api/ingest/promotional/ai] SUCCESS', {
      workMeId,
      companyId,
      productName: response.data.name,
      type: response.data.type,
    })

    return NextResponse.json<PromotionalIngestionResponse>(response)
  } catch (error: any) {
    console.error('❌ POST /api/ingest/promotional/ai error:', error)
    
    // Handle OpenAI-specific errors
    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json<PromotionalIngestionError>(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 },
      )
    }
    
    if (error.status === 401) {
      return NextResponse.json<PromotionalIngestionError>(
        { success: false, error: 'OpenAI API key is invalid' },
        { status: 500 },
      )
    }
    
    if (error.status === 429) {
      return NextResponse.json<PromotionalIngestionError>(
        { success: false, error: 'OpenAI rate limit exceeded. Please try again in a moment.' },
        { status: 429 },
      )
    }

    return NextResponse.json<PromotionalIngestionError>(
      { 
        success: false, 
        error: error.message || 'Failed to parse promotional product data',
      },
      { status: 500 },
    )
  }
}

