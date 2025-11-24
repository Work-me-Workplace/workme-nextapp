/**
 * GPT JSON Mapper Service
 * 
 * Normalizes GPT output into clean Prisma-ready objects
 * Handles string trimming, null conversion, array normalization, and type coercion
 */

interface GPTEventOutput {
  title?: string
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
  promotionNeeds?: string[] | null
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
  description: string | null
  eventDate: Date | null
  startTime: string | null
  endTime: string | null
  eventCategory: string | null
  registrationRequired: string | null
  registrationLink: string | null
  speakers: string[]
  foodProvided: string | null
  foodTypes: string | null
  promotionNeeds: string[]
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

// Allowed event categories
const ALLOWED_CATEGORIES = [
  'Celebration',
  'Heritage',
  'Community',
  'Recognition',
  'Appreciation',
  'Family'
]

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
 * Normalize eventCategory
 * - Must be one of allowed categories
 * - If not matching, use "Unknown"
 */
function normalizeEventCategory(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const normalized = ALLOWED_CATEGORIES.find(
    cat => cat.toLowerCase() === trimmed.toLowerCase()
  )
  return normalized || 'Unknown'
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
    promotionNeeds: normalizeArray(event.promotionNeeds),
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

