/**
 * Benefits Mapper Service
 * 
 * Pure function that extracts structured benefits data from raw text.
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

export interface BenefitsModel {
  title: string | null
  description: string | null
  employeeBenefitSummary: string | null
  windowStart: string | null // ISO date string
  windowEnd: string | null // ISO date string
  actionLink: string | null
  deadlines: Array<{ label: string; date: string }> | null
  resources: Record<string, any> | null
  pocList: Array<{
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
    department?: string | null
  }> | null
}

/**
 * Parse benefits data from raw text
 * Pure function - no side effects
 */
export async function parseBenefits(rawText: string): Promise<BenefitsModel> {
  const openai = getOpenAI()

  const prompt = `Extract structured benefits information from this NAVSEA workforce communication text.

Return JSON with these exact fields:
{
  "title": "Benefits title (or null)",
  "description": "Full description (or null)",
  "employeeBenefitSummary": "Summary for employees (or null)",
  "windowStart": "ISO date string (YYYY-MM-DD) or null",
  "windowEnd": "ISO date string (YYYY-MM-DD) or null",
  "actionLink": "Link to enroll or take action (or null)",
  "deadlines": [
    {"label": "Deadline label", "date": "ISO date string"}
  ] or null,
  "resources": {} or null,
  "pocList": [
    {
      "firstName": "First name (or null)",
      "lastName": "Last name (or null)",
      "email": "Email (or null)",
      "phone": "Phone (or null)",
      "department": "Department (or null)"
    }
  ] or null
}

Text:
${rawText.substring(0, 3000)}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured benefits information from NAVSEA workforce communications. Return only valid JSON.',
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
      title: parsed.title || null,
      description: parsed.description || null,
      employeeBenefitSummary: parsed.employeeBenefitSummary || null,
      windowStart: parsed.windowStart || null,
      windowEnd: parsed.windowEnd || null,
      actionLink: parsed.actionLink || null,
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : null,
      resources: parsed.resources || null,
      pocList: Array.isArray(parsed.pocList) ? parsed.pocList : null,
    }
  } catch (error) {
    console.error('BenefitsMapperService error:', error)
    return {
      title: null,
      description: rawText.substring(0, 500),
      employeeBenefitSummary: null,
      windowStart: null,
      windowEnd: null,
      actionLink: null,
      deadlines: null,
      resources: null,
      pocList: null,
    }
  }
}




