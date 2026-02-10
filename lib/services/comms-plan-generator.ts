/**
 * Comms Plan Generator Service
 * 
 * Generates full comms plan JSON/text from structured fields.
 * This is the final output that can be exported to Word doc.
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

export interface CommsPlanStructuredFields {
  title: string | null
  background: string | null
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

export interface CommsPlanGenerationResult {
  fullText: string
}

/**
 * Generate full comms plan text/JSON from structured fields
 * This creates a comprehensive, formatted comms plan document
 */
export async function generateFullCommsPlan(
  fields: CommsPlanStructuredFields
): Promise<CommsPlanGenerationResult> {
  const openai = getOpenAI()

  const systemPrompt = `You are an expert at creating comprehensive communications plans.

Your task is to generate a complete, professional communications plan document from structured fields.

The output should be:
- Well-formatted and professional
- Suitable for export to Word document
- Include all sections: Background (if provided), Title, Objectives, Messages, Tactics, Timeline
- Format the timeline as a clear product matrix
- Use clear headings and structure
- Be ready for executive review

Format the output as a comprehensive text document that can be copied into Word.`

  const userPrompt = `Generate a full communications plan document from these structured fields:

Title: ${fields.title || 'Untitled Communications Plan'}

${fields.background ? `Background:\n${fields.background}\n\n` : ''}Objectives:
${fields.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'None specified'}

Key Messages:
${fields.messages.map((msg, i) => `${i + 1}. ${msg}`).join('\n') || 'None specified'}

Tactics:
${fields.tactics.map((tactic, i) => `${i + 1}. ${tactic}`).join('\n') || 'None specified'}

Timeline:
${fields.timeline
  ? fields.timeline.phases
      .map((phase) => {
        const dateRange = phase.startDate && phase.endDate
          ? ` (${phase.startDate} - ${phase.endDate})`
          : phase.startDate
          ? ` (Starting ${phase.startDate})`
          : ''
        return `\nPhase: ${phase.name}${dateRange}\n${phase.products
          .map(
            (product) =>
              `  - ${product.name} | Channel: ${product.channel} | Audience: ${product.audience}${product.timing ? ` | Timing: ${product.timing}` : ''}`
          )
          .join('\n')}`
      })
      .join('\n')
  : 'No timeline specified'}

Generate a complete, professional communications plan document.`

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
      temperature: 0.3,
    })

    const fullText = response.choices[0].message.content || ''

    return { fullText }
  } catch (error) {
    console.error('[generateFullCommsPlan] Error:', error)
    // Fallback: generate a simple formatted version
    return {
      fullText: generateFallbackCommsPlan(fields),
    }
  }
}

/**
 * Fallback generator if AI fails - creates a simple formatted version
 */
function generateFallbackCommsPlan(fields: CommsPlanStructuredFields): string {
  const sections = []

  sections.push(`COMMUNICATIONS PLAN`)
  sections.push(`====================`)
  sections.push(``)

  if (fields.title) {
    sections.push(`Title: ${fields.title}`)
    sections.push(``)
  }

  if (fields.background) {
    sections.push(`BACKGROUND`)
    sections.push(`----------`)
    sections.push(fields.background)
    sections.push(``)
  }

  if (fields.objectives.length > 0) {
    sections.push(`OBJECTIVES`)
    sections.push(`----------`)
    fields.objectives.forEach((obj, i) => {
      sections.push(`${i + 1}. ${obj}`)
    })
    sections.push(``)
  }

  if (fields.messages.length > 0) {
    sections.push(`KEY MESSAGES`)
    sections.push(`------------`)
    fields.messages.forEach((msg, i) => {
      sections.push(`${i + 1}. ${msg}`)
    })
    sections.push(``)
  }

  if (fields.tactics.length > 0) {
    sections.push(`TACTICS`)
    sections.push(`-------`)
    fields.tactics.forEach((tactic, i) => {
      sections.push(`${i + 1}. ${tactic}`)
    })
    sections.push(``)
  }

  if (fields.timeline && fields.timeline.phases.length > 0) {
    sections.push(`TIMELINE / PRODUCT MATRIX`)
    sections.push(`-------------------------`)
    fields.timeline.phases.forEach((phase) => {
      const dateRange = phase.startDate && phase.endDate
        ? ` (${phase.startDate} - ${phase.endDate})`
        : phase.startDate
        ? ` (Starting ${phase.startDate})`
        : ''
      sections.push(`\nPhase: ${phase.name}${dateRange}`)
      if (phase.products.length > 0) {
        phase.products.forEach((product) => {
          const timing = product.timing ? ` | Timing: ${product.timing}` : ''
          sections.push(`  - ${product.name} | Channel: ${product.channel} | Audience: ${product.audience}${timing}`)
        })
      }
    })
  }

  return sections.join('\n')
}
