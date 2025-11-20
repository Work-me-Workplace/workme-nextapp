/**
 * Server-only: Get WorkMe ID from request headers or cookies
 * This should be called from server actions or API routes
 */

'use server'

import { cookies, headers } from 'next/headers'

export async function getWorkMeId(): Promise<string | null> {
  // Try to get from cookies first (set by middleware or auth)
  const cookieStore = await cookies()
  const workMeId = cookieStore.get('workMeId')?.value
  
  if (workMeId) {
    return workMeId
  }

  // Try to get from headers (for API routes)
  const headersList = await headers()
  const workMeIdHeader = headersList.get('x-workme-id')
  
  if (workMeIdHeader) {
    return workMeIdHeader
  }

  // Fallback: try to get from localStorage via client-side call
  // This is a placeholder - in production, use proper session management
  return null
}

