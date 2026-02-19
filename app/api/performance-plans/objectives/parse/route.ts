/**
 * POST /api/performance-plans/objectives/parse
 * OpenAI blob parse: raw text → structured objectives { name, howMeasured, howIllContribute? }[]
 * Does NOT save; returns parsed data only.
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

const systemPrompt = `You extract performance or review objectives from unstructured text (job descriptions, role expectations, pasted notes, etc.).
Return ONLY valid JSON with this exact structure:
{
  "objectives": [
    { "name": "Short objective title", "howMeasured": "How success is measured", "howIllContribute": "How I will contribute" },
    ...
  ]
}

Rules:
- Each objective has "name" (string), "howMeasured" (string), and optionally "howIllContribute" (string). Use empty string if a field cannot be inferred.
- Extract 1-15 objectives. Skip vague or non-objective content.
- name: clear, concise (e.g. "Deliver Q2 roadmap", "Improve team feedback scores").
- howMeasured: concrete if possible (e.g. "Completion by June 30", "NPS or survey score").
- howIllContribute: what the person will do to achieve it (optional).
- Return no other fields or text. No markdown, no code fence.`

export async function POST(request: Request) {
  try {
    const { firebaseId } = await verifyAuth(request)
    await loadWorkMe(firebaseId)

    const body = await request.json()
    const rawText = body?.rawText

    if (!rawText || !String(rawText).trim()) {
      return NextResponse.json(
        { success: false, error: 'rawText is required' },
        { status: 400 },
      )
    }

    const openai = getOpenAI()
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract objectives from:\n\n${String(rawText).trim()}` },
      ],
    })

    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'No response from OpenAI' },
        { status: 500 },
      )
    }

    let parsed: {
      objectives?: Array<{ name?: string; howMeasured?: string; howIllContribute?: string }>
    }
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

    const objectives = Array.isArray(parsed.objectives)
      ? parsed.objectives.map(
          (o: { name?: string; howMeasured?: string; howIllContribute?: string }) => ({
            name: String(o?.name ?? '').trim() || 'Untitled objective',
            howMeasured: String(o?.howMeasured ?? '').trim() || null,
            howIllContribute: String(o?.howIllContribute ?? '').trim() || null,
          })
        )
      : []

    return NextResponse.json({
      success: true,
      objectives,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to parse objectives'
    console.error('❌ POST /api/performance-plans/objectives/parse error:', error)

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
