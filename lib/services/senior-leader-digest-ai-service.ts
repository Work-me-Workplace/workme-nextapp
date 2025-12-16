/**
 * Senior Leader Digest AI Service
 * 
 * Rules-driven voice engine for generating senior leader email content.
 * This is NOT creative writing - this is controlled senior-leader voice synthesis.
 */

import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface DigestGenerationInput {
  leaderName: string
  leaderRole: string
  weekOf: string
  sections: {
    deliveries: Array<{
      title: string
      impact?: string
    }>
    wins: Array<{
      title: string
      impact?: string
    }>
    workforce: Array<{
      note: string
    }>
    reminders: Array<{
      note: string
    }>
  }
}

export interface DigestGenerationOutput {
  subjectLine: string
  openingNote: string
}

/**
 * AI SYSTEM PROMPT (LOCKED)
 * You are a senior military leader communicating to the workforce.
 * 
 * Your tone is:
 * - Confident
 * - Forward-looking
 * - Direct
 * - Appreciative without being sentimental
 * 
 * You never:
 * - Use emojis
 * - Use casual slang
 * - Overexplain
 * - Sound like marketing copy
 * 
 * You always:
 * - Start with "Shipmates,"
 * - Reference the week's momentum
 * - Highlight delivery and execution
 * - Reinforce accountability and readiness
 */
const SYSTEM_PROMPT = `You are a senior military leader communicating to the workforce.

Your tone is:
- Confident
- Forward-looking
- Direct
- Appreciative without being sentimental

You never:
- Use emojis
- Use casual slang
- Overexplain
- Sound like marketing copy

You always:
- Start with "Shipmates,"
- Reference the week's momentum
- Highlight delivery and execution
- Reinforce accountability and readiness

Generate a subject line and opening note that reflects these principles. Be concise and authoritative.`

/**
 * Generate senior leader digest content
 * 
 * @param input - Structured input with leader info and digest sections
 * @returns Generated subject line and opening note
 */
export async function generateSeniorLeaderDigest(
  input: DigestGenerationInput
): Promise<DigestGenerationOutput> {
  const openai = getOpenAI()
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  // Build structured user prompt
  const userPrompt = `Generate a weekly digest opening note for ${input.leaderName}, ${input.leaderRole}, for the week of ${input.weekOf}.

DIGEST SECTIONS:

DELIVERIES:
${input.sections.deliveries.length > 0
  ? input.sections.deliveries.map((d, i) => `  ${i + 1}. ${d.title}${d.impact ? ` - ${d.impact}` : ''}`).join('\n')
  : '  None this week'}

WINS:
${input.sections.wins.length > 0
  ? input.sections.wins.map((w, i) => `  ${i + 1}. ${w.title}${w.impact ? ` - ${w.impact}` : ''}`).join('\n')
  : '  None this week'}

WORKFORCE NOTES:
${input.sections.workforce.length > 0
  ? input.sections.workforce.map((w, i) => `  ${i + 1}. ${w.note}`).join('\n')
  : '  None this week'}

REMINDERS:
${input.sections.reminders.length > 0
  ? input.sections.reminders.map((r, i) => `  ${i + 1}. ${r.note}`).join('\n')
  : '  None this week'}

REQUIREMENTS:
- Generate a compelling subject line (8-12 words, forward-looking and confident)
- Generate an opening note (3-5 paragraphs) that:
  * Starts with "Shipmates,"
  * References the week's momentum and execution
  * Highlights key deliveries and wins
  * Acknowledges workforce contributions when present
  * Reinforces accountability and readiness
  * Maintains a confident, direct, forward-looking tone

Return ONLY valid JSON with this exact structure:
{
  "subjectLine": "Your generated subject line here",
  "openingNote": "Your generated opening note here (with proper line breaks using \\n)"
}`

  console.log('[Senior Leader Digest AI] Calling OpenAI', {
    model,
    leaderName: input.leaderName,
    weekOf: input.weekOf,
    deliveriesCount: input.sections.deliveries.length,
    winsCount: input.sections.wins.length,
    workforceCount: input.sections.workforce.length,
    remindersCount: input.sections.reminders.length,
  })

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7, // Slightly higher for natural voice, but still controlled
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
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
    console.error('[Senior Leader Digest AI] JSON parse error:', parseError)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedData = JSON.parse(jsonMatch[0])
    } else {
      throw new Error('Invalid JSON response from OpenAI')
    }
  }

  // Validate structure
  if (!parsedData.subjectLine || !parsedData.openingNote) {
    console.error('[Senior Leader Digest AI] Invalid response structure:', parsedData)
    throw new Error('OpenAI response missing required fields: subjectLine and openingNote')
  }

  return {
    subjectLine: parsedData.subjectLine.trim(),
    openingNote: parsedData.openingNote.trim(),
  }
}
