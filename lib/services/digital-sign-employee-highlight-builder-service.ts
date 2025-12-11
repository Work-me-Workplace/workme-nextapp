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
  factualStatement: string
  quote: string
  quoteAttribution: string
  runtimeGuidance: string
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

Your role is to transform highlight data into clean, structured signage content suitable for NAVSEA-standard internal communications.

Return ONLY this JSON object:

{
  "headline": "",
  "subhead": "",
  "factualStatement": "",
  "quote": "",
  "quoteAttribution": "",
  "runtimeGuidance": ""
}

Follow these rules strictly:

🔹 1. HEADLINE (Formal Award Tone)

Format:

"{FullName} — Award Recipient: {AwardName}"

Examples:

"Peter F. McCauley — Award Recipient: Rosenblatt 'Young Naval Engineer' Award"

"Sarah Johnson — Award Recipient: NAVSEA Collaboration Award"

If awardName is missing:

"{FullName} — Recognition Recipient"

If classification exists but no award:

"{FullName} — Recognition Recipient: {Classification}"

No congratulations.

No narrative text.

Short. Formal. Professional.

🔹 2. SUBHEAD (Objective, Informational)

Provide 1–2 sentences explaining who recognized the employee and for what contribution.

Rules:

Do NOT congratulate here.

Do NOT speak in second person.

Keep tone neutral, institutional, concise.

Example:

"The American Society of Naval Engineers honored him for his exceptional technical leadership and innovative contributions to naval engineering."

🔹 3. FACTUAL STATEMENT

A crisp, standalone factual summary of why the employee is notable.

Examples:

"Recognized for advancing model-based systems engineering techniques in future ship design."

"Honored for leadership in energy modeling and engineering innovation."

🔹 4. QUOTE + ATTRIBUTION (Optional)

If the citation includes a strong line, include it as the quote.

If available, identify the speaker or organization in quoteAttribution.

Examples:

"quote": "\"McCauley exemplifies the qualities the Rosenblatt Award celebrates.\""

"quoteAttribution": "American Society of Naval Engineers"

If no quote is meaningful, return empty strings.

🔹 5. RUNTIME GUIDANCE

For all Employee Recognition signage:

"runtimeGuidance": "2 weeks"

This value is NOT inferred from text — always 2 weeks.

🔹 6. OUTPUT RULES

Return JSON only

No explanatory text

No markdown

No extra fields

END OF SYSTEM PROMPT`

  const userPrompt = `Raw Citation Text (extract ALL information from this):

${input.citationText.substring(0, 4000)}

Extract the employee name, award information, classification, and all other details from the raw text above.

Generate the signage output following the rules exactly. Return ONLY the JSON object with headline, subhead, factualStatement, quote, quoteAttribution, and runtimeGuidance.`

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
    const subhead = parsed.subhead || 'Recognized for outstanding achievement and contributions.'
    const factualStatement = parsed.factualStatement || ''
    const quote = parsed.quote || ''
    const quoteAttribution = parsed.quoteAttribution || ''
    const runtimeGuidance = parsed.runtimeGuidance || '2 weeks'

    return {
      headline,
      subhead,
      factualStatement,
      quote,
      quoteAttribution,
      runtimeGuidance,
    }
  } catch (error) {
    console.error('DigitalSignEmployeeHighlightBuilderService error:', error)
    // Return safe defaults on error
    return {
      headline: 'Employee — Recognition Recipient',
      subhead: 'Recognized for outstanding achievement and contributions.',
      factualStatement: '',
      quote: '',
      quoteAttribution: '',
      runtimeGuidance: '2 weeks',
    }
  }
}
