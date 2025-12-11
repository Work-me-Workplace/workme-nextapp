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

  // Extract first name for subhead
  const firstName = input.employeeFullName.split(' ')[0] || input.employeeFullName

  // Build input object for GPT
  const inputData = {
    employee: {
      fullName: input.employeeFullName,
      companyUnit: input.companyUnitLabel || input.employeeUnit || null,
      photoUrl: null,
    },
    highlight: {
      classification: input.classification || null,
      awardName: input.awardName || null,
      awardYear: input.awardYear || null,
      awardingAgency: input.awardingAgency || null,
      achievement: input.achievement || null,
      citationText: input.citationText.substring(0, 2000),
    },
  }

  const systemPrompt = `You are the CommsIQ Digital Signage Builder responsible for generating FINAL signage output for Employee Highlight slides.

You must follow the CommsIQ Signage Build Guide v2.0 exactly.

Your job:

Take structured highlight data (employee info + highlight info + any raw narrative fields)

Infer the correct headline, subhead, detail block, runtime guidance, and suggested image description

Output ONLY a valid JSON object with these keys:

{
  "headline": "",
  "subhead": "",
  "detailBlock": "",
  "runtimeGuidance": "",
  "suggestedImageDescription": ""
}

🟦 RULES — FOLLOW EXACTLY

🔹 HEADLINE
ALWAYS starts with the employee's full name
MUST append a recognition phrase based on classification OR award
Format:
"{FullName} — {RecognitionPhrase}"
RecognitionPhrase Options:
EXCELLENCE → "Excellence Award"
LEADERSHIP → "Leadership Recognition"
INNOVATION → "Innovation Spotlight"
SERVICE → "Service Achievement"
IMPACT → "Impact Recognition"
If classification missing → use awardName
If both missing → use "Employee Highlight"

🔹 SUBHEAD
ALWAYS begins with Congratulations, {FirstName}!
MUST contain:
who recognized them (awardingAgency OR companyUnitLabel)
what they were recognized for (achievement OR citationText summary)
Aim for 1–2 clean sentences max.

🔹 DETAIL BLOCK
Format: {awardName} · {awardYear}
If awardYear missing → omit
If awardName missing → fallback to:
"Recognition · {awardYear or current year}"

🔹 RUNTIME GUIDANCE
ALWAYS "1 week"
Employee highlights are spotlight content.

🔹 IMAGE DESCRIPTION
MUST describe the ideal photo for designers to use
Examples:
"Use award presentation handshake photo."
"Use smiling portrait with certificate."
"Use main podium shot with award presenter."

🔹 STRICT JSON OUTPUT ONLY
No commentary, no markdown, no explanation.

🟦 BEHAVIORAL RULES
NEVER modify names.
NEVER invent ranks, orgs, or award names.
NEVER add dates not provided.
If a field is missing, gracefully infer context or omit.
Be concise and professional — signage must be clean.`

  const userPrompt = `Input data:

${JSON.stringify(inputData, null, 2)}

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
    const headline = parsed.headline || `${input.employeeFullName} — Employee Highlight`
    const subhead = parsed.subhead || `Congratulations, ${firstName}! Recognized for outstanding achievement.`
    const detailBlock = parsed.detailBlock || (input.awardName && input.awardYear 
      ? `${input.awardName} · ${input.awardYear}`
      : input.awardName || `Recognition · ${input.awardYear || new Date().getFullYear()}`)
    const runtimeGuidance = parsed.runtimeGuidance || '1 week'
    const suggestedImageDescription = parsed.suggestedImageDescription || 'Use award presentation handshake photo.'

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
    const firstName = input.employeeFullName.split(' ')[0] || input.employeeFullName
    const recognitionPhrase = input.classification === 'EXCELLENCE' ? 'Excellence Award'
      : input.classification === 'LEADERSHIP' ? 'Leadership Recognition'
      : input.classification === 'INNOVATION' ? 'Innovation Spotlight'
      : input.classification === 'SERVICE' ? 'Service Achievement'
      : input.classification === 'IMPACT' ? 'Impact Recognition'
      : input.awardName || 'Employee Highlight'
    
    return {
      headline: `${input.employeeFullName} — ${recognitionPhrase}`,
      subhead: `Congratulations, ${firstName}! Recognized by ${input.companyUnitLabel || input.employeeUnit || 'the organization'} for ${input.achievement || 'outstanding achievement'}.`,
      detailBlock: input.awardName && input.awardYear
        ? `${input.awardName} · ${input.awardYear}`
        : input.awardName || `Recognition · ${input.awardYear || new Date().getFullYear()}`,
      runtimeGuidance: '1 week',
      suggestedImageDescription: 'Use award presentation handshake photo.',
    }
  }
}
