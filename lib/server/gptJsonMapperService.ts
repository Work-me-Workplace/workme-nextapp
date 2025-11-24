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
  companyId: string
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
 * Maps string values to enum values
 */
function normalizeEventCategory(value: string | EventCategory | null | undefined): EventCategory | null {
  if (!value) return null
  const strValue = typeof value === 'string' ? value.trim().toUpperCase() : value
  
  // Direct enum match
  if (Object.values(EventCategory).includes(strValue as EventCategory)) {
    return strValue as EventCategory
  }
  
  // Map common string variations to enum
  const categoryMap: Record<string, EventCategory> = {
    'CELEBRATION': EventCategory.CELEBRATION,
    'HERITAGE': EventCategory.HERITAGE,
    'COMMUNITY': EventCategory.COMMUNITY,
    'RECOGNITION': EventCategory.RECOGNITION,
    'APPRECIATION': EventCategory.APPRECIATION,
    'FAMILY': EventCategory.FAMILY,
    'CELEBRATING': EventCategory.CELEBRATION,
    'HERITAGE_MONTH': EventCategory.HERITAGE,
    'COMMUNITY_OUTREACH': EventCategory.COMMUNITY,
    'AWARDS': EventCategory.RECOGNITION,
    'THANK_YOU': EventCategory.APPRECIATION,
    'FAMILY_DAY': EventCategory.FAMILY,
  }
  
  return categoryMap[strValue] || null
}

/**
 * Normalize audience to EventAudience enum
 * Maps string values to enum values
 */
function normalizeAudience(value: string | EventAudience | null | undefined): EventAudience | null {
  if (!value) return null
  const strValue = typeof value === 'string' ? value.trim().toUpperCase() : value
  
  // Direct enum match
  if (Object.values(EventAudience).includes(strValue as EventAudience)) {
    return strValue as EventAudience
  }
  
  // Map common string variations to enum
  const audienceMap: Record<string, EventAudience> = {
    'ALL_WORKFORCE': EventAudience.ALL_WORKFORCE,
    'LEADERS': EventAudience.LEADERS,
    'WORKFORCE_AND_FAMILIES': EventAudience.WORKFORCE_AND_FAMILIES,
    'COMMUNITY': EventAudience.COMMUNITY,
    'ALL_EMPLOYEES': EventAudience.ALL_WORKFORCE,
    'WORKFORCE': EventAudience.ALL_WORKFORCE,
    'SUPERVISORS': EventAudience.LEADERS,
    'COMMAND_LEADERSHIP': EventAudience.LEADERS,
    'FAMILIES': EventAudience.WORKFORCE_AND_FAMILIES,
    'OPEN_HOUSE': EventAudience.WORKFORCE_AND_FAMILIES,
    'LOCAL_COMMUNITY': EventAudience.COMMUNITY,
  }
  
  return audienceMap[strValue] || null
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
  companyId: string,
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
    companyId,
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

