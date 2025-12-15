/**
 * Campaign Mapper Service
 * 
 * Pure function that extracts structured campaign data from raw text.
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

export interface CampaignModel {
  title: string | null
  description: string | null
  windowStart: string | null // ISO date string
  windowEnd: string | null // ISO date string
  ctaLink: string | null
  sponsor: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * Parse campaign data from raw text
 * Pure function - no side effects
 */
export async function parseCampaign(rawText: string): Promise<CampaignModel> {
  const openai = getOpenAI()

  const prompt = `Extract structured campaign information from this NAVSEA workforce communication text.

Return JSON with these exact fields:
{
  "title": "Campaign title or name (or null)",
  "description": "Full description (or null)",
  "windowStart": "ISO date string (YYYY-MM-DD) or null",
  "windowEnd": "ISO date string (YYYY-MM-DD) or null",
  "ctaLink": "Call-to-action link (or null)",
  "sponsor": "Sponsoring office/organization (or null)",
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
          content: 'You are an expert at extracting structured campaign information from NAVSEA workforce communications. Return only valid JSON.',
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
      windowStart: parsed.windowStart || null,
      windowEnd: parsed.windowEnd || null,
      ctaLink: parsed.ctaLink || null,
      sponsor: parsed.sponsor || null,
      pocFirstName: parsed.pocFirstName || null,
      pocLastName: parsed.pocLastName || null,
      pocEmail: parsed.pocEmail || null,
      pocPhone: parsed.pocPhone || null,
    }
  } catch (error) {
    console.error('CampaignMapperService error:', error)
    return {
      title: null,
      description: rawText.substring(0, 500),
      windowStart: null,
      windowEnd: null,
      ctaLink: null,
      sponsor: null,
      pocFirstName: null,
      pocLastName: null,
      pocEmail: null,
      pocPhone: null,
    }
  }
}




