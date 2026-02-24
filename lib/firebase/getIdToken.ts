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

    // Store auth in const so TypeScript knows it's non-null
    const authInstance = auth

    // Wait for auth to be ready if currentUser is null
    let user = authInstance.currentUser
    if (!user) {
      // Wait up to 2 seconds for auth state to initialize
      await new Promise<void>((resolve) => {
        const unsubscribe = authInstance.onAuthStateChanged((user) => {
          unsubscribe()
          resolve()
        })
        // Timeout after 2 seconds
        setTimeout(() => {
          unsubscribe()
          resolve()
        }, 2000)
      })
      user = authInstance.currentUser
    }

    if (!user) {
      console.warn('[getIdToken] No Firebase user found after waiting')
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

