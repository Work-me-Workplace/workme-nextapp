/**
 * Digital Signage Parser Service
 * 
 * Pure function that extracts structured digital signage data from raw text.
 * Supports multiple sign types: WORKFORCE_ACHIEVEMENT, COMPANY_NEWS, WORKFORCE, COMPANY_EVENT
 * No DB writes, no side effects - just parsing.
 */

import OpenAI from 'openai'
import { DigitalSignType } from '@prisma/client'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface ParsedWorkforceAchievement {
  personName: string
  unit?: string | null
  achievement: string
  details?: string | null
}

export interface ParsedCompanyNews {
  headline: string
  subheadline?: string | null
  body?: string | null
  link?: string | null
  thumbnail?: string | null
}

export interface ParsedWorkforce {
  title: string
  summary?: string | null
  bullets?: string[] | null
  imageUrl?: string | null
  footerNote?: string | null
}

export interface ParsedCompanyEvent {
  eventName: string
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  description?: string | null
  perks?: string[] | null
  registrationLink?: string | null
}

export type ParsedDigitalSignage = 
  | { type: 'WORKFORCE_ACHIEVEMENT'; data: ParsedWorkforceAchievement }
  | { type: 'COMPANY_NEWS'; data: ParsedCompanyNews }
  | { type: 'WORKFORCE'; data: ParsedWorkforce }
  | { type: 'COMPANY_EVENT'; data: ParsedCompanyEvent }

/**
 * Parse digital signage data from raw text based on sign type
 * Pure function - no side effects
 */
export async function parseDigitalSignage(
  raw: string,
  signType: DigitalSignType
): Promise<ParsedDigitalSignage> {
  const openai = getOpenAI()

  let prompt = ''
  let systemPrompt = ''

  switch (signType) {
    case 'WORKFORCE_ACHIEVEMENT':
      prompt = `Extract structured workforce achievement information from this text.

Return JSON with these exact fields:
{
  "personName": "Full name of the person being recognized (REQUIRED)",
  "unit": "Organizational unit (e.g., 'NAVSEA 05', 'SEA 08') or null",
  "achievement": "Single-sentence summary of the achievement (REQUIRED)",
  "details": "Full detailed description or citation text or null"
}

IMPORTANT:
- Extract clean entities from the text
- If fields are missing in source, return null for those fields
- Do NOT hallucinate or invent information
- Return only valid JSON

Text:
${raw.substring(0, 4000)}`
      systemPrompt = 'You are an expert at extracting structured workforce achievement information from recognition text. Return only valid JSON.'
      break

    case 'COMPANY_NEWS':
      prompt = `Extract structured company news information from this text.

Return JSON with these exact fields:
{
  "headline": "Main headline/title (REQUIRED)",
  "subheadline": "Subheadline or secondary title or null",
  "body": "Main body text/content or null",
  "link": "Related URL or link or null",
  "thumbnail": "Image URL or thumbnail URL or null"
}

IMPORTANT:
- Extract clean headline, subheadline, and body from the text
- If fields are missing in source, return null for those fields
- Do NOT hallucinate or invent information
- Return only valid JSON

Text:
${raw.substring(0, 4000)}`
      systemPrompt = 'You are an expert at extracting structured company news information from text. Return only valid JSON.'
      break

    case 'WORKFORCE':
      prompt = `Extract structured workforce information from this text.

Return JSON with these exact fields:
{
  "title": "Main title (REQUIRED)",
  "summary": "Summary or overview or null",
  "bullets": ["Array of bullet points"] or null,
  "imageUrl": "Image URL or null",
  "footerNote": "Footer note or call-to-action or null"
}

IMPORTANT:
- Extract clean title, summary, and bullet points from the text
- If fields are missing in source, return null for those fields
- Do NOT hallucinate or invent information
- Return only valid JSON

Text:
${raw.substring(0, 4000)}`
      systemPrompt = 'You are an expert at extracting structured workforce information from text. Return only valid JSON.'
      break

    case 'COMPANY_EVENT':
      prompt = `Extract structured company event information from this text.

Return JSON with these exact fields:
{
  "eventName": "Name of the event (REQUIRED)",
  "eventDate": "Date in YYYY-MM-DD format or null",
  "startTime": "Start time in HH:MM format or null",
  "endTime": "End time in HH:MM format or null",
  "location": "Event location or null",
  "description": "Event description or null",
  "perks": ["Array of perks or benefits"] or null,
  "registrationLink": "Registration URL or null"
}

IMPORTANT:
- Extract clean event information from the text
- If fields are missing in source, return null for those fields
- Do NOT hallucinate or invent information
- Return only valid JSON

Text:
${raw.substring(0, 4000)}`
      systemPrompt = 'You are an expert at extracting structured company event information from text. Return only valid JSON.'
      break

    default:
      throw new Error(`Unsupported sign type: ${signType}`)
  }

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
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    // Validate and normalize based on type
    switch (signType) {
      case 'WORKFORCE_ACHIEVEMENT':
        return {
          type: 'WORKFORCE_ACHIEVEMENT',
          data: {
            personName: parsed.personName || '',
            unit: parsed.unit || null,
            achievement: parsed.achievement || '',
            details: parsed.details || null,
          },
        }

      case 'COMPANY_NEWS':
        return {
          type: 'COMPANY_NEWS',
          data: {
            headline: parsed.headline || '',
            subheadline: parsed.subheadline || null,
            body: parsed.body || null,
            link: parsed.link || null,
            thumbnail: parsed.thumbnail || null,
          },
        }

      case 'WORKFORCE':
        return {
          type: 'WORKFORCE',
          data: {
            title: parsed.title || '',
            summary: parsed.summary || null,
            bullets: Array.isArray(parsed.bullets) ? parsed.bullets.filter((b: any) => b && typeof b === 'string') : null,
            imageUrl: parsed.imageUrl || null,
            footerNote: parsed.footerNote || null,
          },
        }

      case 'COMPANY_EVENT':
        return {
          type: 'COMPANY_EVENT',
          data: {
            eventName: parsed.eventName || '',
            eventDate: parsed.eventDate || null,
            startTime: parsed.startTime || null,
            endTime: parsed.endTime || null,
            location: parsed.location || null,
            description: parsed.description || null,
            perks: Array.isArray(parsed.perks) ? parsed.perks.filter((p: any) => p && typeof p === 'string') : null,
            registrationLink: parsed.registrationLink || null,
          },
        }

      default:
        throw new Error(`Unsupported sign type: ${signType}`)
    }
  } catch (error) {
    console.error('DigitalSignageParser error:', error)
    // Return safe defaults on error
    switch (signType) {
      case 'WORKFORCE_ACHIEVEMENT':
        return {
          type: 'WORKFORCE_ACHIEVEMENT',
          data: {
            personName: '',
            unit: null,
            achievement: '',
            details: raw,
          },
        }
      case 'COMPANY_NEWS':
        return {
          type: 'COMPANY_NEWS',
          data: {
            headline: '',
            subheadline: null,
            body: raw,
            link: null,
            thumbnail: null,
          },
        }
      case 'WORKFORCE':
        return {
          type: 'WORKFORCE',
          data: {
            title: '',
            summary: null,
            bullets: null,
            imageUrl: null,
            footerNote: null,
          },
        }
      case 'COMPANY_EVENT':
        return {
          type: 'COMPANY_EVENT',
          data: {
            eventName: '',
            eventDate: null,
            startTime: null,
            endTime: null,
            location: null,
            description: raw,
            perks: null,
            registrationLink: null,
          },
        }
      default:
        throw new Error(`Unsupported sign type: ${signType}`)
    }
  }
}
