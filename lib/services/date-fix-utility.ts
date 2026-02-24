/**
 * Date Fix Utility
 * 
 * Shared utility to fix dates that are incorrectly parsed (e.g., defaulting to 2024 instead of current year).
 * Used across all CompanyX parsers to ensure consistent date handling.
 */

/**
 * Fix dates that are clearly wrong (in the past when they should be current/future)
 * If a date is more than 1 year in the past, assume it should be current year
 * If fixed date is still in the past, try next year
 */
export function fixDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // If date is more than 1 year old, assume it should be current year
    if (year < currentYear - 1) {
      const fixedDate = new Date(date)
      fixedDate.setFullYear(currentYear)
      // If fixed date is still in the past, try next year
      if (fixedDate < now) {
        fixedDate.setFullYear(currentYear + 1)
      }
      return fixedDate.toISOString().split('T')[0]
    }
    return dateStr
  } catch {
    return dateStr
  }
}

/**
 * Get the current year for use in prompts
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}
