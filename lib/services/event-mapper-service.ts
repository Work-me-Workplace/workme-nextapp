/**
 * Event Mapper Service
 * 
 * Pure function that extracts structured event data from raw text.
 * No DB writes, no side effects - just parsing.
 */

import OpenAI from 'openai'
import { EventCategory, EventAudience } from '@prisma/client'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface EventModel {
  title: string | null
  theme: string | null
  description: string | null
  eventDate: string | null // ISO date string
  startTime: string | null // "09:00"
  endTime: string | null // "10:30"
  eventCategory: EventCategory | null
  registrationRequired: string | null
  registrationLink: string | null
  audience: EventAudience | null
  vibe: string | null
  perks: string[] | null
  participation: string[] | null
  foodProvided: string | null
  foodTypes: string | null
  speakers: string[] | null
  pocEmail: string | null
  pocPhone: string | null
  eventItems: Array<{
    title: string
    description: string | null
    metadata: Record<string, any> | null
  }> | null
}

/**
 * Parse event data from raw text
 * Pure function - no side effects
 */
export async function parseEvent(rawText: string): Promise<EventModel> {
  const openai = getOpenAI()

  const validCategories = Object.values(EventCategory).join(', ')
  const validAudiences = Object.values(EventAudience).join(', ')

  const prompt = `Extract structured event information from this NAVSEA workforce communication text.

Return JSON with these exact fields:
{
  "title": "Event title or name (or null)",
  "theme": "Event theme (or null)",
  "description": "Full description (or null)",
  "eventDate": "ISO date string (YYYY-MM-DD) or null",
  "startTime": "Time string in HH:MM format (e.g., '09:00') or null",
  "endTime": "Time string in HH:MM format (e.g., '10:30') or null",
  "eventCategory": "One of: ${validCategories} (or null)",
  "registrationRequired": "yes" or "no" or "optional" or null,
  "registrationLink": "Registration URL (or null)",
  "audience": "One of: ${validAudiences} (or null)",
  "vibe": "Event vibe/tone (or null)",
  "perks": ["perk1", "perk2"] or null,
  "participation": ["activity1", "activity2"] or null,
  "foodProvided": "yes" or "no" or null,
  "foodTypes": "Types of food (or null)",
  "speakers": ["Speaker 1", "Speaker 2"] or null,
  "pocEmail": "Email address (or null)",
  "pocPhone": "Phone number (or null)",
  "eventItems": [
    {
      "title": "Item title",
      "description": "Item description (or null)",
      "metadata": {} or null
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
          content: 'You are an expert at extracting structured event information from NAVSEA workforce communications. Return only valid JSON.',
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

    // Validate enums
    const validEventCategories = Object.values(EventCategory)
    const validEventAudiences = Object.values(EventAudience)

    return {
      title: parsed.title || null,
      theme: parsed.theme || null,
      description: parsed.description || null,
      eventDate: parsed.eventDate || null,
      startTime: parsed.startTime || null,
      endTime: parsed.endTime || null,
      eventCategory: validEventCategories.includes(parsed.eventCategory) ? parsed.eventCategory : null,
      registrationRequired: parsed.registrationRequired || null,
      registrationLink: parsed.registrationLink || null,
      audience: validEventAudiences.includes(parsed.audience) ? parsed.audience : null,
      vibe: parsed.vibe || null,
      perks: Array.isArray(parsed.perks) ? parsed.perks.filter((p: any) => p) : null,
      participation: Array.isArray(parsed.participation) ? parsed.participation.filter((p: any) => p) : null,
      foodProvided: parsed.foodProvided || null,
      foodTypes: parsed.foodTypes || null,
      speakers: Array.isArray(parsed.speakers) ? parsed.speakers.filter((s: any) => s) : null,
      pocEmail: parsed.pocEmail || null,
      pocPhone: parsed.pocPhone || null,
      eventItems: Array.isArray(parsed.eventItems) && parsed.eventItems.length > 0
        ? parsed.eventItems.map((item: any) => ({
            title: item.title || 'Untitled Item',
            description: item.description || null,
            metadata: item.metadata || null,
          }))
        : null,
    }
  } catch (error) {
    console.error('EventMapperService error:', error)
    // Return safe defaults on error
    return {
      title: null,
      theme: null,
      description: rawText.substring(0, 500),
      eventDate: null,
      startTime: null,
      endTime: null,
      eventCategory: null,
      registrationRequired: null,
      registrationLink: null,
      audience: null,
      vibe: null,
      perks: null,
      participation: null,
      foodProvided: null,
      foodTypes: null,
      speakers: null,
      pocEmail: null,
      pocPhone: null,
      eventItems: null,
    }
  }
}
