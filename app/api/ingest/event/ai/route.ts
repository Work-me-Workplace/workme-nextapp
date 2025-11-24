import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import OpenAI from 'openai'
import type { EventIngestionRequest, EventIngestionAPIResponse, EventIngestionAPIError } from '@/lib/types/event-ingestion'

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

/**
 * POST /api/ingest/event/ai
 * AI ingestion endpoint for parsing unstructured event text into structured WorkEvent + EventItem data
 * 
 * Body: { rawText: string, userContext?: {...} }
 * Returns: { success: true, data: { event, items } } or { success: false, error: "..." }
 * 
 * Does NOT save to database - this is a pure parsing endpoint
 */
export async function POST(request: Request) {
  try {
    // Verify Firebase token and get authenticated context
    const { workMeId, companyId } = await verifyAuth(request)

    console.log('[API POST /api/ingest/event/ai]', {
      workMeId,
      companyId,
    })

    const body: EventIngestionRequest = await request.json()
    const { rawText, userContext } = body

    if (!rawText || !rawText.trim()) {
      return NextResponse.json<EventIngestionAPIError>(
        { success: false, error: 'rawText is required' },
        { status: 400 },
      )
    }

    // Build system prompt (exact as specified)
    const systemPrompt = `You convert messy government or corporate event announcements into structured
event JSON. Return ONLY JSON with the exact structure below.

Extract:

1. Core details — title, theme, description, date, times
2. Category — must be Celebration, Heritage, Community, Recognition, Appreciation, Family or Unknown
3. Attendance — registrationRequired, registrationLink
4. Food details
5. Speakers (array)
6. Agenda blocks → items[]
7. Highlights inferred from tone/context:
   - audience: string
   - participation: string[]
   - perks: string[]
   - vibe: string

NEVER return IDs.

Return only:

{
  "event": {
    "title": "",
    "theme": "",
    "description": "",
    "eventDate": "",
    "startTime": "",
    "endTime": "",
    "eventCategory": "",
    "registrationRequired": "",
    "registrationLink": "",
    "speakers": [],
    "foodProvided": "",
    "foodTypes": "",
    "audience": "",
    "participation": [],
    "perks": [],
    "vibe": ""
  },
  "items": [
    {
      "title": "",
      "description": "",
      "metadata": {}
    }
  ]
}`

    // Build user prompt
    let userPrompt = `Parse this event announcement:\n\n${rawText}`
    
    if (userContext) {
      userPrompt += `\n\nUser-provided context:\n`
      if (userContext.eventDate) {
        userPrompt += `- Event Date: ${userContext.eventDate}\n`
      }
      if (userContext.category) {
        userPrompt += `- Category: ${userContext.category}\n`
      }
      if (userContext.startTime) {
        userPrompt += `- Start Time: ${userContext.startTime}\n`
      }
      if (userContext.endTime) {
        userPrompt += `- End Time: ${userContext.endTime}\n`
      }
      userPrompt += `\nUse this context to infer missing information where obvious.`
    }

    // Call OpenAI
    const openai = getOpenAIClient()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    console.log('[API POST /api/ingest/event/ai] Calling OpenAI', {
      model,
      rawTextLength: rawText.length,
      hasUserContext: !!userContext,
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
      console.error('[API POST /api/ingest/event/ai] JSON parse error:', parseError)
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI')
      }
    }

    // Validate response structure
    if (!parsedData.event || !parsedData.items) {
      console.error('[API POST /api/ingest/event/ai] Invalid response structure:', parsedData)
      throw new Error('OpenAI response missing required fields: event and items')
    }

    // Ensure items is an array
    if (!Array.isArray(parsedData.items)) {
      parsedData.items = []
    }

    // Normalize the response to match our types (exact structure from spec)
    const response: EventIngestionAPIResponse = {
      success: true,
      data: {
        event: {
          title: parsedData.event.title || '',
          theme: parsedData.event.theme || null,
          description: parsedData.event.description || null,
          eventDate: parsedData.event.eventDate || null,
          startTime: parsedData.event.startTime || null,
          endTime: parsedData.event.endTime || null,
          eventCategory: parsedData.event.eventCategory || null,
          registrationRequired: parsedData.event.registrationRequired || null,
          registrationLink: parsedData.event.registrationLink || null,
          speakers: Array.isArray(parsedData.event.speakers) ? parsedData.event.speakers : [],
          foodProvided: parsedData.event.foodProvided || null,
          foodTypes: parsedData.event.foodTypes || null,
          audience: parsedData.event.audience || null,
          participation: Array.isArray(parsedData.event.participation) ? parsedData.event.participation : [],
          perks: Array.isArray(parsedData.event.perks) ? parsedData.event.perks : [],
          vibe: parsedData.event.vibe || null,
        },
        items: parsedData.items.map((item: any) => ({
          title: item.title || '',
          description: item.description || null,
          metadata: item.metadata || null,
        })),
      },
    }

    console.log('[API POST /api/ingest/event/ai] SUCCESS', {
      workMeId,
      companyId,
      eventTitle: response.data.event.title,
      itemsCount: response.data.items.length,
    })

    return NextResponse.json<EventIngestionAPIResponse>(response)
  } catch (error: any) {
    console.error('❌ POST /api/ingest/event/ai error:', error)
    
    // Handle OpenAI-specific errors
    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json<EventIngestionAPIError>(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 },
      )
    }
    
    if (error.status === 401) {
      return NextResponse.json<EventIngestionAPIError>(
        { success: false, error: 'OpenAI API key is invalid' },
        { status: 500 },
      )
    }
    
    if (error.status === 429) {
      return NextResponse.json<EventIngestionAPIError>(
        { success: false, error: 'OpenAI rate limit exceeded. Please try again in a moment.' },
        { status: 429 },
      )
    }

    return NextResponse.json<EventIngestionAPIError>(
      { 
        success: false, 
        error: error.message || 'Failed to parse event data',
      },
      { status: 500 },
    )
  }
}

