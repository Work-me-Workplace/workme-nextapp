/**
 * Event Mapper Service
 * 
 * Pure function that extracts structured event data from raw text.
 * No DB writes, no side effects - just parsing.
 */

import OpenAI from 'openai'
import { EventCategory, EventAudience } from '@prisma/client'
import { fixDate, getCurrentYear } from './date-fix-utility'

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
  location: string | null
  eventCategory: EventCategory | null
  registrationRequired: string | null
  registrationLink: string | null
  audience: EventAudience | null
  vibe: string | null
  eventItems: string[] | null  // Highlights, agenda items, key moments (prefer over participation)
  participation: string[] | null // Deprecated: use eventItems for agenda/activities
  foodProvided: string | null
  foodTypes: string | null
  speakers: string[] | null
  intendedEffect: string | null  // What should the workforce walk away with?
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * Parse event data from raw text
 * Pure function - no side effects
 */
export async function parseEvent(rawText: string): Promise<EventModel> {
  const openai = getOpenAI()

  const validCategories = Object.values(EventCategory).join(', ')
  const validAudiences = Object.values(EventAudience).join(', ')
  const currentYear = getCurrentYear()

  const prompt = `Extract structured event information from this workforce communication text.

INFERENCE RULES (prefer inferring over null when context is clear):
- title: If the text does not state a formal title, infer one from theme and context (e.g. "Employee Appreciation Day" from "appreciation day", "Coffee & Pastries" or "Refreshments" from "we're having coffee and pastries").
- theme: If not stated, infer from title or description (e.g. "Appreciation" from "Employee Appreciation Day", "Recognition" from recognition event).
- description: If there is no explicit paragraph labeled as description, synthesize a short description from what the text says: combine event type, when/where, and any key details (refreshments, remarks time, etc.). Do not leave description null when the input clearly describes the event.
- audience: Infer workforce involvement from context: company-wide or all-employee → ALL_WORKFORCE. Prefer ALL_WORKFORCE when it is clearly an internal workforce event.
- foodProvided and foodTypes: CRITICAL — Whenever the text mentions refreshments, food, or drinks (e.g. "coffee and pastries", "we're having coffee and pastries", "light breakfast", "refreshments", "lunch provided", "donuts", "catered"), set foodProvided to "yes" and foodTypes to a short list of what is mentioned (e.g. "coffee, pastries"). Also add those items to eventItems so they appear as highlights (e.g. "Coffee and pastries").
- eventItems: Include agenda items, highlights, and key offerings (e.g. "Coffee and pastries", "Remarks at 10:00", "Networking"). Prefer eventItems over participation for all such content.
- intendedEffect: In one short sentence, what should the workforce walk away with? (e.g. "Feel recognized and connected.", "Understand Q4 priorities.", "Celebrate heritage and belonging.") Infer from event type and tone if not stated.

Return JSON with these exact fields:
{
  "title": "Event title or inferred title (or null)",
  "theme": "Event theme or inferred theme (or null)",
  "description": "Full or inferred description (never null if input describes the event)",
  "eventDate": "ISO date string (YYYY-MM-DD). IMPORTANT: If date has no year (e.g., 'Feb. 25'), use current year (${currentYear}). If date is in the past relative to today, assume it's next occurrence. Or null",
  "startTime": "Time string in HH:MM format (e.g., '09:00') or null",
  "endTime": "Time string in HH:MM format (e.g., '10:30') or null",
  "location": "Event location/venue (or null)",
  "eventCategory": "One of: ${validCategories} (or null)",
  "registrationRequired": "yes" or "no" or "optional" or null,
  "registrationLink": "Registration URL (or null)",
  "audience": "One of: ${validAudiences} (or null)",
  "vibe": "Event vibe/tone (or null)",
  "eventItems": ["e.g. Coffee and pastries", "Highlight 2", "Key moment"] or null,
  "participation": [] or null (deprecated; put activities in eventItems instead),
  "foodProvided": "yes" or "no" or null (must be \"yes\" if text mentions refreshments/food/drinks)",
  "foodTypes": "e.g. coffee, pastries (or null)",
  "speakers": ["Speaker 1", "Speaker 2"] or null,
  "intendedEffect": "One sentence: what should workforce walk away with? (or null)",
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

    // Fallback: if description is still blank, infer from title/theme/time/location
    let description = parsed.description?.trim() || null
    if (!description && (parsed.title || parsed.theme || parsed.startTime || parsed.location)) {
      const parts: string[] = []
      if (parsed.title) parts.push(parsed.title + '.')
      else if (parsed.theme) parts.push(`${parsed.theme} event.`)
      if (parsed.startTime) parts.push(`Remarks at ${parsed.startTime}.`)
      if (parsed.location) parts.push(`Location: ${parsed.location}.`)
      description = parts.length > 0 ? parts.join(' ') : null
    }

    // Fallback: hydrate food from raw text when model missed it (e.g. "we're having coffee and pastries")
    const lower = rawText.toLowerCase()
    const foodKeywords = /\b(coffee|pastries|donuts|doughnuts|breakfast|lunch|refreshments|catered|food|snacks|drinks|beverages)\b/
    let foodProvided = parsed.foodProvided || null
    let foodTypes = parsed.foodTypes || null
    if (foodKeywords.test(lower) && !foodProvided) {
      foodProvided = 'yes'
      if (!foodTypes) {
        const matches = lower.match(/\b(coffee|pastries|donuts|doughnuts|breakfast|lunch|refreshments|snacks|drinks|beverages)\b/g)
        foodTypes = matches ? [...new Set(matches)].join(', ') : 'refreshments'
      }
    }
    // If we set food and eventItems is empty, add food to eventItems so it shows as a highlight
    let eventItems = Array.isArray(parsed.eventItems)
      ? parsed.eventItems
          .map((item: any) => (typeof item === 'string' ? item : item?.title || item?.description))
          .filter((p: any) => p)
      : []
    if (foodProvided === 'yes' && foodTypes && eventItems.length === 0)
      eventItems = [foodTypes.charAt(0).toUpperCase() + foodTypes.slice(1)]

    return {
      title: parsed.title || null,
      theme: parsed.theme || null,
      description,
      eventDate: fixDate(parsed.eventDate),
      startTime: parsed.startTime || null,
      endTime: parsed.endTime || null,
      location: parsed.location || null,
      eventCategory: validEventCategories.includes(parsed.eventCategory) ? parsed.eventCategory : null,
      registrationRequired: parsed.registrationRequired || null,
      registrationLink: parsed.registrationLink || null,
      audience: validEventAudiences.includes(parsed.audience) ? parsed.audience : null,
      vibe: parsed.vibe || null,
      eventItems: eventItems.length > 0 ? eventItems : null,
      participation: Array.isArray(parsed.participation) ? parsed.participation.filter((p: any) => p) : null,
      foodProvided,
      foodTypes,
      speakers: Array.isArray(parsed.speakers) ? parsed.speakers.filter((s: any) => s) : null,
      intendedEffect: parsed.intendedEffect?.trim() || null,
      pocEmail: parsed.pocEmail || null,
      pocPhone: parsed.pocPhone || null,
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
      location: null,
      eventCategory: null,
      registrationRequired: null,
      registrationLink: null,
      audience: null,
      vibe: null,
      eventItems: null,
      participation: null,
      foodProvided: null,
      foodTypes: null,
      speakers: null,
      intendedEffect: null,
      pocEmail: null,
      pocPhone: null,
    }
  }
}




