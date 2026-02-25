/**
 * Get Firebase ID Token - Client-Only Helper
 * 
 * Safely retrieves Firebase ID token for API requests
 * Returns null if auth is not ready or user is not authenticated
 */

'use client'

import { auth } from '@/lib/firebase'

export async function getIdToken(forceRefresh = false): Promise<string | null> {
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

    // Wait for auth to be ready if currentUser is null (e.g. Firebase restoring session from persistence)
    let user = authInstance.currentUser
    if (!user) {
      // Wait up to 5s for auth state — restoring session can be slow; 2s caused "Missing token" for logged-in users
      await new Promise<void>((resolve) => {
        const unsubscribe = authInstance.onAuthStateChanged((user) => {
          unsubscribe()
          resolve()
        })
        setTimeout(() => {
          unsubscribe()
          resolve()
        }, 5000)
      })
      user = authInstance.currentUser
    }

    if (!user) {
      console.warn('[getIdToken] No Firebase user found after waiting')
      return null
    }

    const token = await user.getIdToken(forceRefresh)
    return token
  } catch (error: any) {
    console.error('[getIdToken] Error getting token:', error)
    return null
  }
}

