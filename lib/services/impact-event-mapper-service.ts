/**
 * Impact Event Mapper Service
 * 
 * Pure function that extracts structured impact event data from raw text.
 * No DB writes, no side effects - just parsing.
 */

import OpenAI from 'openai'
import { fixDate, getCurrentYear } from './date-fix-utility'

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
  description: string | null // The impact/deal - what's happening
  summary: string | null // Comprehensive summary with all key details
  effectiveDate: string | null // ISO date string
  location: string | null
  impactedPopulation: string | null // Who it affects
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
  const currentYear = getCurrentYear()

  const prompt = `Extract structured impact event information from this NAVSEA workforce communication text.
Impact events are disruptions, changes, or announcements that affect the workforce.

CRITICAL FOR SUMMARY:
- DO NOT abbreviate or lose key details
- KEEP all deadlines (dates, times, pay periods)
- KEEP all codes (leave codes, reference numbers)
- KEEP all specific requirements (what employees must do, what supervisors must do)
- The summary should be COMPREHENSIVE enough that someone can act on it

Return JSON with these exact fields:
{
  "title": "Impact event title (or null)",
  "description": "The impact/deal - what's happening. Full description (or null)",
  "summary": "COMPREHENSIVE summary that KEEPS all critical details: deadlines, codes, requirements, dates, times, pay periods, leave codes, etc. Do NOT abbreviate! (or null)",
  "effectiveDate": "ISO date string (YYYY-MM-DD). IMPORTANT: If date has no year (e.g., 'Feb. 25'), use current year (${currentYear}). If date is in the past relative to today, assume it's next occurrence. Or null",
  "location": "Location if applicable (or null)",
  "impactedPopulation": "Who is affected (or null)",
  "urgency": "Urgency level: Low, Medium, High, or Critical (or null)",
  "pocFirstName": "Point of contact first name (or null)",
  "pocLastName": "Point of contact last name (or null)",
  "pocEmail": "Point of contact email (or null)",
  "pocPhone": "Point of contact phone (or null)"
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
      summary: parsed.summary || null,
      effectiveDate: fixDate(parsed.effectiveDate),
      location: parsed.location || null,
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
      summary: rawText.substring(0, 500),
      effectiveDate: null,
      location: null,
      impactedPopulation: null,
      urgency: null,
      pocFirstName: null,
      pocLastName: null,
      pocEmail: null,
      pocPhone: null,
    }
  }
}




