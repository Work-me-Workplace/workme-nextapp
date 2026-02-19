/**
 * POST /api/performance-plans/objectives/suggest-measures
 * Suggests "how measured" for an objective: numeric (counts, deadlines) and qualitative (e.g. "X% feel valued").
 * Does NOT save; returns suggestions only.
 */

import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

let openaiInstance: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiInstance
}

const systemPrompt = `You suggest ways to measure success for a performance objective. You are given the objective title and/or how the person will contribute.

Return ONLY valid JSON with this exact structure:
{
  "suggestions": [
    "First suggested measure (string)",
    "Second suggested measure (string)",
    ...
  ]
}

Rules:
- Provide 3–5 short, concrete suggestions.
- Mix types:
  - Numeric/output: counts, deadlines, volume (e.g. "Deliver 12 Town Hall materials by end of period", "Complete by June 30").
  - Qualitative/outcome: survey or sentiment (e.g. "X% of employees feel valued in annual survey", "NPS or satisfaction score improvement", "Stakeholder feedback positive in post-event survey").
- Each suggestion is one sentence. No bullets or numbering in the strings.
- If the objective is vague, suggest measures that would make it measurable.
- Return no other fields or text. No markdown, no code fence.`

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    await loadWorkMe(firebaseId)

    const body = await request.json()
    const name = body?.name != null ? String(body.name).trim() : ''
    const howIllContribute = body?.howIllContribute != null ? String(body.howIllContribute).trim() : ''

    if (!name && !howIllContribute) {
      return NextResponse.json(
        { success: false, error: 'name or howIllContribute is required' },
        { status: 400 },
      )
    }

    const openai = getOpenAI()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            name && `Objective: ${name}`,
            howIllContribute && `How I'll contribute: ${howIllContribute}`,
          ]
            .filter(Boolean)
            .join('\n\n'),
        },
      ],
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No response from OpenAI' },
        { status: 500 },
      )
    }

    let parsed: { suggestions?: string[] }
    try {
      parsed = JSON.parse(content)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON from OpenAI' },
          { status: 500 },
        )
      }
    }

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean)
      : []

    return NextResponse.json({
      success: true,
      suggestions: suggestions.length > 0 ? suggestions : ['Completion and quality of deliverables; stakeholder feedback.'],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to suggest measures'
    console.error('❌ POST /api/performance-plans/objectives/suggest-measures error:', error)

    if (message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key is not configured' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}
