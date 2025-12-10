/**
 * Digital Sign Employee Highlight Builder Service
 * 
 * Service that builds final digital signage products from employee highlights.
 * Takes raw highlight + employee data → produces final slide artifact JSON.
 * 
 * This follows the CommsIQ Signage Build Guide v2.0 structure.
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

export interface EmployeeHighlightInput {
  employeeFullName: string
  employeeTitle?: string | null
  employeeUnit?: string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  achievement?: string | null
  citationText: string
  classification?: string | null
}

export interface DigitalSignOutput {
  headline: string
  subhead: string | null
  detailBlock: string | null
  runtimeGuidance: string
  suggestedImageDescription: string | null
}

/**
 * Build final digital signage JSON from employee highlight data
 * Returns structured data according to CommsIQ Signage Build Guide v2.0
 */
export async function buildDigitalSignFromHighlight(
  input: EmployeeHighlightInput
): Promise<DigitalSignOutput> {
  const openai = getOpenAI()

  const prompt = `You are the CommsIQ Digital Signage Builder for the Employee Highlight pipeline.
Your job is to take raw highlight data and generate a final signage product according to the CommsIQ Signage Build Guide v2.0.

You MUST return valid JSON with the following fields:
- headline
- subhead
- detailBlock
- runtimeGuidance
- suggestedImageDescription

Rules:
- Headline MUST start with the employee's full name followed by a recognition phrase.
  Example: "Sarah Johnson — Excellence Award"
- Subhead MUST congratulate the employee and expand context.
  Example: "Congratulations, Sarah! Recognized by SEA 05 for outstanding leadership."
- DetailBlock MUST be award name + year, or best available combination.
  Example: "NAVSEA Excellence Award · 2025"
- Runtime ALWAYS "1 week"
- SuggestedImageDescription MUST describe the ideal photo selection ("use award handshake photo").

Return JSON ONLY — with NO commentary.

Employee Data:
- Full Name: ${input.employeeFullName}
- Title: ${input.employeeTitle || 'N/A'}
- Unit: ${input.employeeUnit || 'N/A'}
- Award Name: ${input.awardName || 'N/A'}
- Awarding Agency: ${input.awardingAgency || 'N/A'}
- Award Year: ${input.awardYear || 'N/A'}
- Achievement: ${input.achievement || 'N/A'}
- Classification: ${input.classification || 'N/A'}

Citation Text:
${input.citationText.substring(0, 2000)}`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at building digital signage content for employee recognition. Return only valid JSON with no commentary.',
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

    return {
      headline: parsed.headline || `${input.employeeFullName} — Recognition`,
      subhead: parsed.subhead || null,
      detailBlock: parsed.detailBlock || null,
      runtimeGuidance: parsed.runtimeGuidance || '1 week',
      suggestedImageDescription: parsed.suggestedImageDescription || null,
    }
  } catch (error) {
    console.error('DigitalSignEmployeeHighlightBuilderService error:', error)
    // Return safe defaults on error
    return {
      headline: `${input.employeeFullName} — Recognition`,
      subhead: input.employeeUnit 
        ? `Congratulations! Recognized by ${input.employeeUnit} for outstanding achievement.`
        : 'Congratulations on your outstanding achievement!',
      detailBlock: input.awardName && input.awardYear
        ? `${input.awardName} · ${input.awardYear}`
        : input.awardName || null,
      runtimeGuidance: '1 week',
      suggestedImageDescription: 'Use award ceremony photo with handshake.',
    }
  }
}
