/**
 * Employee Cause Mapper Service
 * 
 * Pure function that extracts structured employee cause data from raw text.
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

export interface EmployeeCauseModel {
  title: string | null
  description: string | null
  impactSummary: string | null
  partnerOrg: string | null
  windowStart: string | null // ISO date string
  windowEnd: string | null // ISO date string
  locations: string[] | null
  link: string | null
  deadlines: Array<{ label: string; date: string }> | null
  sponsoringDepartment: string | null
  pocList: Array<{
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    phone?: string | null
  }> | null
  extraInstructions: Record<string, any> | null
}

/**
 * Parse employee cause data from raw text
 * Pure function - no side effects
 */
export async function parseEmployeeCause(rawText: string): Promise<EmployeeCauseModel> {
  const openai = getOpenAI()

  const prompt = `Extract structured employee cause information from this NAVSEA workforce communication text.
Employee causes are employee-driven initiatives, collections, fundraisers, or drives.

Return JSON with these exact fields:
{
  "title": "Employee cause title (or null)",
  "description": "Full description (or null)",
  "partnerOrg": "Partner organization (or null)",
  "windowStart": "ISO date string (YYYY-MM-DD) or null",
  "windowEnd": "ISO date string (YYYY-MM-DD) or null",
  "locations": ["location1", "location2"] or null,
  "link": "Sign-up or donation link (or null)",
  "deadlines": [{"label": "Deadline label", "date": "ISO date string"}] or null,
  "sponsoringDepartment": "Department (or null)",
  "impactSummary": "Summary of impact (or null)",
  "extraInstructions": {} or null,
  "pocList": [
    {
      "firstName": "First name (or null)",
      "lastName": "Last name (or null)",
      "email": "Email (or null)",
      "phone": "Phone (or null)"
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
          content: 'You are an expert at extracting structured employee cause information from NAVSEA workforce communications. Return only valid JSON.',
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
      windowStart: parsed.windowStart || null,
      windowEnd: parsed.windowEnd || null,
      locations: Array.isArray(parsed.locations) ? parsed.locations.filter((l: any) => l) : null,
      link: parsed.link || null,
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : null,
      sponsoringDepartment: parsed.sponsoringDepartment || null,
      impactSummary: parsed.impactSummary || null,
      extraInstructions: parsed.extraInstructions || null,
      pocList: Array.isArray(parsed.pocList) ? parsed.pocList : null,
    }
  } catch (error) {
    console.error('EmployeeCauseMapperService error:', error)
    return {
      title: null,
      description: rawText.substring(0, 500),
      partnerOrg: null,
      windowStart: null,
      windowEnd: null,
      locations: null,
      link: null,
      deadlines: null,
      sponsoringDepartment: null,
      impactSummary: null,
      extraInstructions: null,
      pocList: null,
    }
  }
}




