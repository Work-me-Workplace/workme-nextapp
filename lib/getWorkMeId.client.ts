/**
 * Client-only: Get workMeId from localStorage
 * Safe to import in client components
 */

export function getWorkMeIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('workMeId')
}

