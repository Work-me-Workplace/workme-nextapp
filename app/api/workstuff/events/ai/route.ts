/**
 * WorkStuff Events AI Parse
 * 
 * POST /api/workstuff/events/ai
 * AI ingestion endpoint for parsing unstructured event text into structured data
 * 
 * Body: { rawText: string, userContext?: {...} }
 * Returns: { success: true, data: { event, items } } or { success: false, error: "..." }
 * 
 * Does NOT save to database - this is a pure parsing endpoint
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import OpenAI from 'openai'
import type { EventIngestionRequest, EventIngestionAPIResponse, EventIngestionAPIError } from '@/lib/types/event-ingestion'

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

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    console.log('[API POST /api/workstuff/events/ai]', {
      workMeId,
      companyUnit,
    })

    const body: EventIngestionRequest = await request.json()
    const { rawText, userContext } = body

    if (!rawText || !rawText.trim()) {
      return NextResponse.json<EventIngestionAPIError>(
        { success: false, error: 'rawText is required' },
        { status: 400 },
      )
    }

    const systemPrompt = `You convert messy government or corporate event announcements into structured
event JSON. Return ONLY JSON with the exact structure below.

Extract:

1. Core details — title, theme, description, date, times
2. Category — must be exactly one of: CELEBRATION, HERITAGE, COMMUNITY, RECOGNITION, APPRECIATION, FAMILY
   - Holiday events → CELEBRATION
   - Heritage / DEI / cultural → HERITAGE
   - Outreach / impact / external → COMMUNITY
   - Awards → RECOGNITION
   - Thank-you or morale → APPRECIATION
   - Family day events → FAMILY
3. Audience — must be exactly one of: ALL_WORKFORCE, LEADERS, WORKFORCE_AND_FAMILIES, COMMUNITY
   - "all directorates / workforce / NAVSEA employees" → ALL_WORKFORCE
   - "leaders / supervisors / command leadership" → LEADERS
   - mentions kids, families, or open house → WORKFORCE_AND_FAMILIES
   - mentions local community, partners, visitors → COMMUNITY
4. Attendance — registrationRequired, registrationLink
5. Food details
6. Speakers (array)
7. Agenda blocks → items[]
8. Highlights inferred from tone/context:
   - participation: string[]
   - eventItems: string[] (highlights, agenda items, key moments)
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
    "eventCategory": "CELEBRATION" | "HERITAGE" | "COMMUNITY" | "RECOGNITION" | "APPRECIATION" | "FAMILY",
    "registrationRequired": "",
    "registrationLink": "",
    "speakers": [],
    "foodProvided": "",
    "foodTypes": "",
    "audience": "ALL_WORKFORCE" | "LEADERS" | "WORKFORCE_AND_FAMILIES" | "COMMUNITY",
    "participation": [],
    "eventItems": [],
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

    let userPrompt = `Parse this event announcement:\n\n${rawText}`
    
    if (userContext && userContext.trim()) {
      userPrompt += `\n\nAdditional context/instructions from user:\n${userContext.trim()}\n\nUse this context to guide your interpretation and infer missing information where appropriate.`
    }

    const openai = getOpenAIClient()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    console.log('[API POST /api/workstuff/events/ai] Calling OpenAI', {
      model,
      rawTextLength: rawText.length,
      hasUserContext: !!userContext,
    })

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
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

    let parsedData: any
    try {
      parsedData = JSON.parse(content)
    } catch (parseError) {
      console.error('[API POST /api/workstuff/events/ai] JSON parse error:', parseError)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response from OpenAI')
      }
    }

    if (!parsedData.event || !parsedData.items) {
      console.error('[API POST /api/workstuff/events/ai] Invalid response structure:', parsedData)
      throw new Error('OpenAI response missing required fields: event and items')
    }

    if (!Array.isArray(parsedData.items)) {
      parsedData.items = []
    }

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
          eventItems: Array.isArray(parsedData.event.eventItems) ? parsedData.event.eventItems : [],
          vibe: parsedData.event.vibe || null,
        },
        items: parsedData.items.map((item: any) => ({
          title: item.title || '',
          description: item.description || null,
          metadata: item.metadata || null,
        })),
      },
    }

    console.log('[API POST /api/workstuff/events/ai] SUCCESS', {
      workMeId,
      companyUnit,
      eventTitle: response.data.event.title,
      itemsCount: response.data.items.length,
    })

    return NextResponse.json<EventIngestionAPIResponse>(response)
  } catch (error: any) {
    console.error('❌ POST /api/workstuff/events/ai error:', error)
    
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
