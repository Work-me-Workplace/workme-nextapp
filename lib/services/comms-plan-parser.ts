/**
 * Comms Plan Parser Service
 * 
 * Parses raw text input into structured comms plan fields:
 * - title
 * - objectives (array)
 * - messages (array)
 * - tactics (array)
 * - timeline (product matrix structure)
 */

import OpenAI from 'openai'
import { fixDate, getCurrentYear } from './date-fix-utility'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface ParsedCommsPlan {
  title: string | null
  background: string | null // Background/context section
  objectives: string[]
  messages: string[]
  tactics: string[]
  timeline: {
    phases: Array<{
      name: string
      startDate?: string
      endDate?: string
      products: Array<{
        name: string
        channel: string
        audience: string
        timing?: string
      }>
    }>
  } | null
}

export interface CommsPlanParseResult {
  parsed: ParsedCommsPlan
}

/**
 * Parse raw text into structured comms plan fields
 */
export async function parseCommsPlan(
  rawText: string
): Promise<CommsPlanParseResult> {
  const openai = getOpenAI()
  const currentYear = getCurrentYear()

  const systemPrompt = `You are an expert at parsing communications plans from raw text.

Your task is to extract structured information from the provided text and organize it into:
1. Title - The main title/name of the comms plan
2. Background - Context, history, or background information that informs the comms plan (if present)
3. Objectives - Array of communication objectives/goals
4. Messages - Array of key messages to communicate
5. Tactics - Array of communication tactics/channels/methods
6. Timeline - A product matrix structure with phases, products, channels, audiences, and timing

RULES:
- Extract information that is explicitly stated in the text
- If information is missing, use null or empty arrays
- Background should capture historical context, root causes, or situational context that informs why this comms plan is needed
- Objectives should be clear, measurable goals
- Messages should be key talking points or themes
- Tactics should be specific communication methods (email, meetings, posters, etc.)
- Timeline should organize activities into phases with products/channels/audiences
- Be thorough but accurate - don't invent information that isn't in the text

Return ONLY valid JSON in this format:
{
  "title": "Q4 Product Launch Communications Plan",
  "background": "Recent organizational changes and workforce concerns about job security have created uncertainty. This plan addresses those concerns.",
  "objectives": [
    "Increase awareness of new product features",
    "Drive adoption among target audience"
  ],
  "messages": [
    "New features improve efficiency",
    "Product supports strategic goals"
  ],
  "tactics": [
    "Email campaign",
    "Town hall meetings",
    "Digital signage",
    "Intranet articles"
  ],
  "timeline": {
    "phases": [
      {
        "name": "Pre-Launch",
        "startDate": "ISO date string (YYYY-MM-DD). IMPORTANT: If date has no year, use current year (${currentYear}). Or null",
        "endDate": "ISO date string (YYYY-MM-DD). IMPORTANT: If date has no year, use current year (${currentYear}). Or null",
        "products": [
          {
            "name": "Teaser Email",
            "channel": "Email",
            "audience": "All employees",
            "timing": "Week 1"
          }
        ]
      }
    ]
  }
}`

  const userPrompt = `Parse this communications plan text into structured fields:

${rawText.substring(0, 8000)}`

  try {
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

    // Validate and normalize the response
    const result: ParsedCommsPlan = {
      title: typeof parsed.title === 'string' ? parsed.title.trim() || null : null,
      background: typeof parsed.background === 'string' ? parsed.background.trim() || null : null,
      objectives: Array.isArray(parsed.objectives)
        ? parsed.objectives
            .filter((obj: any) => typeof obj === 'string' && obj.trim())
            .map((obj: any) => obj.trim())
        : [],
      messages: Array.isArray(parsed.messages)
        ? parsed.messages
            .filter((msg: any) => typeof msg === 'string' && msg.trim())
            .map((msg: any) => msg.trim())
        : [],
      tactics: Array.isArray(parsed.tactics)
        ? parsed.tactics
            .filter((tactic: any) => typeof tactic === 'string' && tactic.trim())
            .map((tactic: any) => tactic.trim())
        : [],
      timeline: parsed.timeline && typeof parsed.timeline === 'object' && parsed.timeline.phases
        ? {
            phases: Array.isArray(parsed.timeline.phases)
              ? parsed.timeline.phases
                  .filter((phase: any) => phase && typeof phase.name === 'string')
                  .map((phase: any) => ({
                    name: phase.name.trim(),
                    startDate: fixDate(phase.startDate) || undefined,
                    endDate: fixDate(phase.endDate) || undefined,
                    products: Array.isArray(phase.products)
                      ? phase.products
                          .filter((product: any) => product && typeof product.name === 'string')
                          .map((product: any) => ({
                            name: product.name.trim(),
                            channel: typeof product.channel === 'string' ? product.channel.trim() : '',
                            audience: typeof product.audience === 'string' ? product.audience.trim() : '',
                            timing: typeof product.timing === 'string' ? product.timing.trim() : undefined,
                          }))
                      : [],
                  }))
              : [],
          }
        : null,
    }

    return { parsed: result }
  } catch (error) {
    console.error('[parseCommsPlan] Error:', error)
    // Return empty structure on error
    return {
      parsed: {
        title: null,
        background: null,
        objectives: [],
        messages: [],
        tactics: [],
        timeline: null,
      },
    }
  }
}
