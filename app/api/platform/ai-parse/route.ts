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

export interface PlatformParseResult {
  platform: {
    name: string
    category: string
    programCode?: string | null
    description?: string | null
    whySpecial?: string | null
  }
  units: Array<{
    hullNumber: string
    name?: string | null
    lifecycleStatus?: string | null
  }>
  milestones: Array<{
    title: string
    description?: string | null
    date?: string | null
  }>
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

    const prompt = `Extract structured platform product information from this text (Wikipedia, CRS report, press release, etc.).

Return JSON with this exact structure:
{
  "platform": {
    "name": "Platform name (e.g., 'Virginia-class', 'DDG-1000')",
    "category": "Category (e.g., 'Submarine', 'Surface Ship', 'Aircraft')",
    "programCode": "Program code if mentioned (e.g., 'SSN', 'SSBN', 'DDG') or null",
    "description": "Description of the platform or null",
    "whySpecial": "What makes this platform special or null"
  },
  "units": [
    {
      "hullNumber": "Hull number (e.g., 'SSN 804', 'DDG 1000')",
      "name": "Unit name if mentioned or null",
      "lifecycleStatus": "Status if mentioned (e.g., 'under construction', 'in service') or null"
    }
  ],
  "milestones": [
    {
      "title": "Milestone title (e.g., 'Keel Laying', 'Delivery')",
      "description": "Description or null",
      "date": "ISO date string (YYYY-MM-DD) if mentioned or null"
    }
  ]
}

Text:
${text.substring(0, 4000)}`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured platform product information from defense and naval documentation. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    // Validate structure
    if (!parsed.platform || !parsed.platform.name || !parsed.platform.category) {
      return NextResponse.json(
        { success: false, error: 'Invalid response structure from AI' },
        { status: 500 }
      )
    }

    const result: PlatformParseResult = {
      platform: {
        name: parsed.platform.name || '',
        category: parsed.platform.category || '',
        programCode: parsed.platform.programCode || null,
        description: parsed.platform.description || null,
        whySpecial: parsed.platform.whySpecial || null,
      },
      units: Array.isArray(parsed.units) ? parsed.units.map((u: any) => ({
        hullNumber: u.hullNumber || '',
        name: u.name || null,
        lifecycleStatus: u.lifecycleStatus || null,
      })) : [],
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones.map((m: any) => ({
        title: m.title || '',
        description: m.description || null,
        date: m.date || null,
      })) : [],
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Failed to parse platform with AI:', error)
    
    if (error.message?.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse platform' },
      { status: 500 }
    )
  }
}
