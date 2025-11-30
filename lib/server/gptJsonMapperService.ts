/**
 * GPT JSON Mapper Service
 * 
 * Normalizes GPT output into clean Prisma-ready objects
 * Handles string trimming, null conversion, array normalization, and type coercion
 */

import { EventAudience, EventCategory } from "@prisma/client"

interface GPTEventOutput {
  title?: string
  theme?: string | null
  description?: string | null
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  eventCategory?: string | null
  registrationRequired?: string | null
  registrationLink?: string | null
  speakers?: string[] | null
  foodProvided?: string | null
  foodTypes?: string | null
  audience?: EventAudience | null
  vibe?: string | null
  perks?: string[] | null
  participation?: string[] | null
}

interface GPTItemOutput {
  title?: string
  description?: string | null
  metadata?: Record<string, any> | null
}

interface GPTIngestionOutput {
  event: GPTEventOutput
  items?: GPTItemOutput[]
}

interface NormalizedEventData {
  title: string
  theme: string | null
  description: string | null
  eventDate: Date | null
  startTime: string | null
  endTime: string | null
  eventCategory: EventCategory | null
  registrationRequired: string | null
  registrationLink: string | null
  speakers: string[]
  foodProvided: string | null
  foodTypes: string | null
  audience: EventAudience | null
  vibe: string | null
  perks: string[]
  participation: string[]
  pocEmail: string | null
  pocPhone: string | null
  companyUnit: string | null
  originatorId: string
}

interface NormalizedItemData {
  title: string
  description: string | null
  metadata: Record<string, any> | null
}

interface NormalizedIngestionData {
  eventData: NormalizedEventData
  eventItemsData: NormalizedItemData[]
}

/**
 * Normalize a string value
 * - Trim whitespace
 * - Convert empty string to null
 */
function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Normalize an array
 * - Ensure it's always an array (never null)
 * - Filter out empty strings
 * - Trim all strings
 */
function normalizeArray(value: string[] | null | undefined): string[] {
  if (!value || !Array.isArray(value)) {
    return []
  }
  return value
    .map(item => typeof item === 'string' ? item.trim() : String(item).trim())
    .filter(item => item !== '')
}

/**
 * Normalize foodProvided to "Yes" or "No"
 */
function normalizeFoodProvided(value: string | null | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'yes' || normalized === 'y' || normalized === 'true') {
    return 'Yes'
  }
  if (normalized === 'no' || normalized === 'n' || normalized === 'false') {
    return 'No'
  }
  return null
}

/**
 * Normalize eventCategory to EventCategory enum
 * Maps string values to enum values (case-insensitive, handles variations)
 */
function normalizeEventCategory(value: string | EventCategory | null | undefined): EventCategory | null {
  if (!value) return null
  
  // If already an enum, return it
  if (typeof value !== 'string') {
    if (Object.values(EventCategory).includes(value)) {
      return value
    }
    return null
  }
  
  const trimmed = value.trim()
  if (!trimmed) return null
  
  const upperValue = trimmed.toUpperCase()
  
  // Direct enum match (uppercase)
  if (Object.values(EventCategory).includes(upperValue as EventCategory)) {
    return upperValue as EventCategory
  }
  
  // Map common string variations to enum (case-insensitive matching)
  const categoryMap: Record<string, EventCategory> = {
    // Direct matches (uppercase)
    'CELEBRATION': EventCategory.CELEBRATION,
    'HERITAGE': EventCategory.HERITAGE,
    'COMMUNITY': EventCategory.COMMUNITY,
    'RECOGNITION': EventCategory.RECOGNITION,
    'APPRECIATION': EventCategory.APPRECIATION,
    'FAMILY': EventCategory.FAMILY,
    // Variations
    'CELEBRATING': EventCategory.CELEBRATION,
    'HERITAGE_MONTH': EventCategory.HERITAGE,
    'COMMUNITY_OUTREACH': EventCategory.COMMUNITY,
    'AWARDS': EventCategory.RECOGNITION,
    'AWARD': EventCategory.RECOGNITION,
    'THANK_YOU': EventCategory.APPRECIATION,
    'THANKS': EventCategory.APPRECIATION,
    'FAMILY_DAY': EventCategory.FAMILY,
  }
  
  // Check map with uppercase value
  if (categoryMap[upperValue]) {
    return categoryMap[upperValue]
  }
  
  // Fuzzy matching for common patterns
  const lowerValue = trimmed.toLowerCase()
  if (lowerValue.includes('celebration') || lowerValue.includes('holiday')) {
    return EventCategory.CELEBRATION
  }
  if (lowerValue.includes('heritage') || lowerValue.includes('dei') || lowerValue.includes('cultural')) {
    return EventCategory.HERITAGE
  }
  if (lowerValue.includes('community') || lowerValue.includes('outreach') || lowerValue.includes('external')) {
    return EventCategory.COMMUNITY
  }
  if (lowerValue.includes('recognition') || lowerValue.includes('award')) {
    return EventCategory.RECOGNITION
  }
  if (lowerValue.includes('appreciation') || lowerValue.includes('thank') || lowerValue.includes('morale')) {
    return EventCategory.APPRECIATION
  }
  if (lowerValue.includes('family')) {
    return EventCategory.FAMILY
  }
  
  console.warn(`[normalizeEventCategory] Could not map value: "${value}" (normalized: "${upperValue}")`)
  return null
}

/**
 * Normalize audience to EventAudience enum
 * Maps string values to enum values (case-insensitive, handles variations)
 */
function normalizeAudience(value: string | EventAudience | null | undefined): EventAudience | null {
  if (!value) return null
  
  // If already an enum, return it
  if (typeof value !== 'string') {
    if (Object.values(EventAudience).includes(value)) {
      return value
    }
    return null
  }
  
  const trimmed = value.trim()
  if (!trimmed) return null
  
  const upperValue = trimmed.toUpperCase()
  
  // Direct enum match (uppercase)
  if (Object.values(EventAudience).includes(upperValue as EventAudience)) {
    return upperValue as EventAudience
  }
  
  // Map common string variations to enum (case-insensitive matching)
  const audienceMap: Record<string, EventAudience> = {
    // Direct matches
    'ALL_WORKFORCE': EventAudience.ALL_WORKFORCE,
    'LEADERS': EventAudience.LEADERS,
    'WORKFORCE_AND_FAMILIES': EventAudience.WORKFORCE_AND_FAMILIES,
    'COMMUNITY': EventAudience.COMMUNITY,
    // Variations
    'ALL_EMPLOYEES': EventAudience.ALL_WORKFORCE,
    'WORKFORCE': EventAudience.ALL_WORKFORCE,
    'SUPERVISORS': EventAudience.LEADERS,
    'COMMAND_LEADERSHIP': EventAudience.LEADERS,
    'FAMILIES': EventAudience.WORKFORCE_AND_FAMILIES,
    'OPEN_HOUSE': EventAudience.WORKFORCE_AND_FAMILIES,
    'LOCAL_COMMUNITY': EventAudience.COMMUNITY,
  }
  
  // Check map with uppercase value
  if (audienceMap[upperValue]) {
    return audienceMap[upperValue]
  }
  
  // Fuzzy matching for common patterns
  const lowerValue = trimmed.toLowerCase()
  if (lowerValue.includes('all') && (lowerValue.includes('workforce') || lowerValue.includes('employee'))) {
    return EventAudience.ALL_WORKFORCE
  }
  if (lowerValue.includes('leader') || lowerValue.includes('supervisor') || lowerValue.includes('command')) {
    return EventAudience.LEADERS
  }
  if (lowerValue.includes('family') || lowerValue.includes('open house') || lowerValue.includes('kids')) {
    return EventAudience.WORKFORCE_AND_FAMILIES
  }
  if (lowerValue.includes('community') || lowerValue.includes('partner') || lowerValue.includes('visitor')) {
    return EventAudience.COMMUNITY
  }
  
  console.warn(`[normalizeAudience] Could not map value: "${value}" (normalized: "${upperValue}")`)
  return null
}

/**
 * Parse eventDate string to Date object
 * - Accepts YYYY-MM-DD format
 * - Returns null if invalid or missing
 */
function parseEventDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  
  // Try to parse YYYY-MM-DD format
  const dateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateMatch) {
    const date = new Date(trimmed)
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  // Try general date parsing
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) {
    return date
  }
  
  return null
}

/**
 * Normalize GPT ingestion output into Prisma-ready objects
 */
export function normalizeGPTIngestionOutput(
  gptOutput: GPTIngestionOutput,
  companyUnit: string | null,
  originatorId: string
): NormalizedIngestionData {
  const event = gptOutput.event || {}
  const items = gptOutput.items || []

  // Normalize event data
  const eventData: NormalizedEventData = {
    title: normalizeString(event.title) || 'Untitled Event',
    theme: normalizeString(event.theme),
    description: normalizeString(event.description),
    eventDate: parseEventDate(event.eventDate),
    startTime: normalizeString(event.startTime),
    endTime: normalizeString(event.endTime),
    eventCategory: normalizeEventCategory(event.eventCategory),
    registrationRequired: normalizeString(event.registrationRequired),
    registrationLink: normalizeString(event.registrationLink),
    speakers: normalizeArray(event.speakers),
    foodProvided: normalizeFoodProvided(event.foodProvided),
    foodTypes: normalizeString(event.foodTypes),
    audience: normalizeAudience(event.audience),
    vibe: normalizeString(event.vibe),
    perks: normalizeArray(event.perks),
    participation: normalizeArray(event.participation),
    pocEmail: null, // Not in GPT output, can be added later
    pocPhone: null, // Not in GPT output, can be added later
    companyUnit,
    originatorId,
  }

  // Normalize event items data
  const eventItemsData: NormalizedItemData[] = items.map((item) => ({
    title: normalizeString(item.title) || 'Untitled Item',
    description: normalizeString(item.description),
    metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : null,
  }))

  return {
    eventData,
    eventItemsData,
  }
}

