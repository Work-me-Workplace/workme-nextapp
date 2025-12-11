/**
 * Impact Event Mapper Service
 * 
 * Pure function that extracts structured impact event data from raw text.
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

export interface ImpactEventModel {
  title: string | null
  description: string | null
  effectiveDate: string | null // ISO date string
  impactedPopulation: string | null
  urgency: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * Parse impact event data from raw text
 * Pure function - no side effects
 */
export async function parseImpactEvent(rawText: string): Promise<ImpactEventModel> {
  const openai = getOpenAI()

  const prompt = `Extract structured impact event information from this NAVSEA workforce communication text.
Impact events are disruptions, changes, or announcements that affect the workforce.

Return JSON with these exact fields:
{
  "title": "Impact event title (or null)",
  "description": "Full description (or null)",
  "effectiveDate": "ISO date string (YYYY-MM-DD) or null",
  "impactedPopulation": "Who is affected (or null)",
  "urgency": "Urgency level (or null)",
  "pocFirstName": "First name (or null)",
  "pocLastName": "Last name (or null)",
  "pocEmail": "Email address (or null)",
  "pocPhone": "Phone number (or null)"
}

Text:
${rawText.substring(0, 3000)}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured impact event information from NAVSEA workforce communications. Return only valid JSON.',
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
      effectiveDate: parsed.effectiveDate || null,
      impactedPopulation: parsed.impactedPopulation || null,
      urgency: parsed.urgency || null,
      pocFirstName: parsed.pocFirstName || null,
      pocLastName: parsed.pocLastName || null,
      pocEmail: parsed.pocEmail || null,
      pocPhone: parsed.pocPhone || null,
    }
  } catch (error) {
    console.error('ImpactEventMapperService error:', error)
    return {
      title: null,
      description: rawText.substring(0, 500),
      effectiveDate: null,
      impactedPopulation: null,
      urgency: null,
      pocFirstName: null,
      pocLastName: null,
      pocEmail: null,
      pocPhone: null,
    }
  }
}

