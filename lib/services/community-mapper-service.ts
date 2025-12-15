/**
 * Community Mapper Service
 * 
 * Pure function that extracts structured community opportunity data from raw text.
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

export interface CommunityModel {
  title: string | null
  description: string | null
  partnerOrg: string | null
  date: string | null // ISO date string
  location: string | null
  signUpLink: string | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * Parse community opportunity data from raw text
 * Pure function - no side effects
 */
export async function parseCommunity(rawText: string): Promise<CommunityModel> {
  const openai = getOpenAI()

  const prompt = `Extract structured community opportunity information from this NAVSEA workforce communication text.

Return JSON with these exact fields:
{
  "title": "Community opportunity title (or null)",
  "description": "Full description (or null)",
  "partnerOrg": "Partner organization (or null)",
  "date": "ISO date string (YYYY-MM-DD) or null",
  "location": "Location (or null)",
  "signUpLink": "Sign-up link (or null)",
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
          content: 'You are an expert at extracting structured community opportunity information from NAVSEA workforce communications. Return only valid JSON.',
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
      partnerOrg: parsed.partnerOrg || null,
      date: parsed.date || null,
      location: parsed.location || null,
      signUpLink: parsed.signUpLink || null,
      pocFirstName: parsed.pocFirstName || null,
      pocLastName: parsed.pocLastName || null,
      pocEmail: parsed.pocEmail || null,
      pocPhone: parsed.pocPhone || null,
    }
  } catch (error) {
    console.error('CommunityMapperService error:', error)
    return {
      title: null,
      description: rawText.substring(0, 500),
      partnerOrg: null,
      date: null,
      location: null,
      signUpLink: null,
      pocFirstName: null,
      pocLastName: null,
      pocEmail: null,
      pocPhone: null,
    }
  }
}




