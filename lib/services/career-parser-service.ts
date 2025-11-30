/**
 * CareerParserService
 * 
 * Pure function that extracts structured career data from raw text.
 * No DB writes, no side effects - just parsing.
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

export interface CareerModel {
  title: string | null
  description: string | null
  level: 'NAVSEA' | 'NAVY' | 'DOD' | null
  type: 'Leadership' | 'Fellowship' | 'Other' | null
  eligibility: {
    paygradeRange: { min: string | null; max: string | null }
    timeInServiceMonths: number | null
    timeInPositionMonths: number | null
    who: string | null
  }
  application: {
    instructions: string | null
    link: string | null
  }
  extras: {
    cost: string | null
    notes: string[] | null
  }
}

/**
 * Parse career data from raw text
 * Pure function - no side effects
 */
export async function parseCareer(rawText: string): Promise<CareerModel> {
  const openai = getOpenAI()

  const prompt = `Extract the following fields from the NAVSEA/Navy/DoD text. 

Do NOT hallucinate missing info. 

Return valid JSON only.

Fields:
- title
- description
- level: NAVSEA, NAVY, DOD
- type: Leadership, Fellowship, Other

eligibility:
- paygradeRange: { min, max }
- timeInServiceMonths
- timeInPositionMonths
- who (summary of who is eligible)

application:
- instructions
- link

extras:
- cost
- notes (array)

If a field is missing, set its value to null.
Return JSON ONLY.

Text:
${rawText.substring(0, 3000)}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured career opportunity information from NAVSEA/Navy/DoD workforce communications. Return only valid JSON.',
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

    // Validate and normalize
    return {
      title: parsed.title || null,
      description: parsed.description || null,
      level: ['NAVSEA', 'NAVY', 'DOD'].includes(parsed.level) ? parsed.level : null,
      type: ['Leadership', 'Fellowship', 'Other'].includes(parsed.type) ? parsed.type : null,
      eligibility: {
        paygradeRange: {
          min: parsed.eligibility?.paygradeRange?.min || null,
          max: parsed.eligibility?.paygradeRange?.max || null,
        },
        timeInServiceMonths: typeof parsed.eligibility?.timeInServiceMonths === 'number' ? parsed.eligibility.timeInServiceMonths : null,
        timeInPositionMonths: typeof parsed.eligibility?.timeInPositionMonths === 'number' ? parsed.eligibility.timeInPositionMonths : null,
        who: parsed.eligibility?.who || null,
      },
      application: {
        instructions: parsed.application?.instructions || null,
        link: parsed.application?.link || null,
      },
      extras: {
        cost: parsed.extras?.cost || null,
        notes: Array.isArray(parsed.extras?.notes) ? parsed.extras.notes : null,
      },
    }
  } catch (error) {
    console.error('CareerParserService error:', error)
    // Return safe defaults on error
    return {
      title: null,
      description: rawText.substring(0, 500),
      level: null,
      type: null,
      eligibility: {
        paygradeRange: { min: null, max: null },
        timeInServiceMonths: null,
        timeInPositionMonths: null,
        who: null,
      },
      application: {
        instructions: null,
        link: null,
      },
      extras: {
        cost: null,
        notes: null,
      },
    }
  }
}

