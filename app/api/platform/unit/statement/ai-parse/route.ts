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
  aiSummary: string
  aiTags: string[]
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

    const systemPrompt = `You are a platform unit statement summarizer.

Your job is to create a concise summary and extract relevant tags from articles about platform units (ships, aircraft, systems, etc.).

Keep it simple - just summarize what happened and tag it.`

    const userPrompt = `Summarize this article about a platform unit and extract relevant tags.

Return JSON with:
- aiSummary: A 2-4 sentence summary of what happened (factual, concise)
- aiTags: Array of 3-6 relevant tags (e.g., ["keel laying", "milestone", "shipyard", "virginia class"])

Text:
${text.substring(0, 4000)}

Return ONLY valid JSON.`

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
      temperature: 0.3,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    const result: StatementParseResult = {
      aiSummary: parsed.aiSummary || parsed.summary || '',
      aiTags: Array.isArray(parsed.aiTags) ? parsed.aiTags : (Array.isArray(parsed.tags) ? parsed.tags : []),
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
