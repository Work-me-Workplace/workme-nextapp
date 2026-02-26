/**
 * Get Firebase ID Token - Client-Only Helper
 *
 * Used by the API interceptor. AuthProvider gates the app until auth is ready,
 * so by the time any component makes API calls, auth.currentUser is set.
 * No wait/retry needed.
 */

'use client'

import { auth } from '@/lib/firebase'

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !auth) return null
    const user = auth.currentUser
    if (!user) return null
    return user.getIdToken(forceRefresh)
  } catch (error: any) {
    console.error('[getIdToken] Error:', error)
    return null
  }
}

