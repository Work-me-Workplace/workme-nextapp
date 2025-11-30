/**
 * Server-side Firebase Token Verification
 * 
 * Pure Firebase authentication - verifies ID tokens only
 * Does NOT fetch WorkMe or membership data
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import { getAdminAuth } from './firebaseAdmin'

export interface VerifiedAuth {
  firebaseId: string
  email: string | null
  displayName: string | null
  photoUrl: string | null
}

/**
 * Verify Firebase token from Request Authorization header
 * Pure authentication - returns Firebase user data only
 * 
 * @param request - Next.js Request object (for API routes)
 * @throws Error if token is missing or invalid
 * @returns {VerifiedAuth} Firebase user data
 */
export async function verifyAuth(request?: Request): Promise<VerifiedAuth> {
  // For API routes, use request headers. For server actions, use next/headers
  let authHeader: string | null = null
  
  if (request) {
    authHeader = request.headers.get('authorization')
  } else {
    // Fallback for server actions that don't have Request object
    const { headers } = await import('next/headers')
    const headersList = await headers()
    authHeader = headersList.get('authorization')
  }

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing token')
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    // Verify Firebase ID token using Admin SDK
    const decodedToken = await getAdminAuth().verifyIdToken(token)

    console.log('[verifyAuth] Token verified:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
    })

    return {
      firebaseId: decodedToken.uid,
      email: decodedToken.email || null,
      displayName: decodedToken.name || null,
      photoUrl: decodedToken.picture || null,
    }
  } catch (error: any) {
    console.error('[verifyAuth] Token verification failed:', {
      error: error.message,
      code: error.code,
    })

    // Re-throw with clear error message
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Unauthorized: Token expired. Please sign in again.')
    }
    if (error.code === 'auth/argument-error') {
      throw new Error('Unauthorized: Invalid token. Please sign in again.')
    }

    throw new Error(`Unauthorized: ${error.message || 'Authentication failed'}`)
  }
}

/**
 * Optionally verify token (returns null if invalid, doesn't throw)
 * Useful for routes that can work with or without auth
 */
export async function optionallyVerifyAuth(): Promise<VerifiedAuth | null> {
  try {
    return await verifyAuth()
  } catch {
    return null
  }
}

