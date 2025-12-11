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
  companyUnitLabel?: string | null
}

export interface DigitalSignOutput {
  headline: string
  subhead: string
  detailBlock: string
  runtimeGuidance: string
  suggestedImageDescription: string
}

/**
 * Build final digital signage JSON from employee highlight data
 * Returns structured data according to CommsIQ Signage Build Guide v2.0
 * 
 * This is the "digitalSignEmployeeHighlightBuilder" agent.
 */
export async function buildDigitalSignFromHighlight(
  input: EmployeeHighlightInput
): Promise<DigitalSignOutput> {
  const openai = getOpenAI()

  // GPT will extract everything from the raw citationText
  // We pass the raw text and GPT extracts: person name, award, year, agency, classification, etc.

  const systemPrompt = `You are the WorkMe Digital Signage Builder for Employee Recognition slides.

Your role is to generate clean, professional, NAVSEA-standard signage output based on:

- employee information
- award information
- unit information
- achievement summaries
- citation text (optional context)

You must output a JSON object in this exact format:

{
  "headline": "",
  "subhead": "",
  "detailBlock": "",
  "runtimeGuidance": "",
  "suggestedImageDescription": ""
}

Follow these rules strictly:

🔹 1. HEADLINE (Critical Rule)

Use this format:

"{FullName} — Award Recipient: {AwardName}"

Examples:

"Peter McCauley — Award Recipient: Rosenblatt 'Young Naval Engineer' Award"

"Sarah Johnson — Award Recipient: NAVSEA Collaboration Award"

If awardName is not available:

"{FullName} — Recognition Recipient"

If classification is present but no award name:

"{FullName} — Recognition Recipient: {Classification}"

Do NOT congratulate in the headline.
Do NOT write full sentences.
This must read like official signage, not a narrative.

🔹 2. SUBHEAD (Informational Tone)

Provide 1–2 sentences describing who honored the employee and why.

Rules:

No congratulations
No "you," "your," or second-person language
No narrative fluff

Examples:

"The American Society of Naval Engineers honored him for his distinguished achievements in naval engineering and leadership."

"NAVSEA recognized her innovative contributions to future ship design."

Tone must be neutral, professional, and suitable for NAVSEA lobby screens.

🔹 3. DETAIL BLOCK (Optional)

Include only if meaningful, non-duplicative context exists:

- award organization
- award year
- a brief citation phrase
- a supervisor quote

Do not repeat the headline.

If nothing useful:

""

Examples:

"American Society of Naval Engineers · 2024"

""A rising leader in naval innovation.""

🔹 4. RUNTIME GUIDANCE

Always return:

"1 week"

This is the standard display lifetime for recognition signage.

🔹 5. SUGGESTED IMAGE DESCRIPTION

Give a short instruction to designers on which photo to use.

Examples:

"Use smiling portrait with certificate."

"Use award presentation photo if available."

🔹 6. OUTPUT REQUIREMENTS

Output JSON only
No commentary
No markdown
No extra fields

This JSON is consumed directly by the WorkMe signage builder.`

  const userPrompt = `Raw Citation Text (extract ALL information from this):

${input.citationText.substring(0, 4000)}

Extract the employee name, award information, classification, and all other details from the raw text above.

Generate the signage output following the rules exactly. Return ONLY the JSON object with headline, subhead, detailBlock, runtimeGuidance, and suggestedImageDescription.`

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

    // Validate and return - all fields are required strings
    // GPT extracted everything from raw text, so use its output
    const headline = parsed.headline || 'Employee — Recognition Recipient'
    const subhead = parsed.subhead || 'Recognized for outstanding achievement.'
    const detailBlock = parsed.detailBlock || ''
    const runtimeGuidance = parsed.runtimeGuidance || '1 week'
    const suggestedImageDescription = parsed.suggestedImageDescription || 'Use award presentation photo if available.'

    return {
      headline,
      subhead,
      detailBlock,
      runtimeGuidance,
      suggestedImageDescription,
    }
  } catch (error) {
    console.error('DigitalSignEmployeeHighlightBuilderService error:', error)
    // Return safe defaults on error
    return {
      headline: 'Employee — Recognition Recipient',
      subhead: 'Recognized for outstanding achievement.',
      detailBlock: '',
      runtimeGuidance: '1 week',
      suggestedImageDescription: 'Use award presentation photo if available.',
    }
  }
}
