/**
 * Get Firebase ID Token - Client-Only Helper
 * 
 * Safely retrieves Firebase ID token for API requests
 * Returns null if auth is not ready or user is not authenticated
 */

'use client'

import { auth } from '@/lib/firebase'

export async function getIdToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    if (!auth) {
      console.warn('[getIdToken] Firebase auth not initialized')
      return null
    }

    const user = auth.currentUser
    if (!user) {
      console.warn('[getIdToken] No Firebase user found')
      return null
    }

    // Get fresh token (Firebase SDK automatically refreshes if needed)
    const token = await user.getIdToken(true) // Force refresh for reliability
    return token
  } catch (error: any) {
    console.error('[getIdToken] Error getting token:', error)
    return null
  }
}

