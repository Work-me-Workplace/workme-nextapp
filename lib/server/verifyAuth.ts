/**
 * Server-side Firebase Token Verification
 * 
 * Uses Firebase Admin SDK to verify ID tokens from Authorization header
 * Returns authenticated user's workMeId, companyUnit, and companyDivision
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import { getAdminAuth } from './firebaseAdmin'
import { prisma } from '@/lib/prisma'

export interface VerifiedAuth {
  workMeId: string
  companyUnit: string | null // Required for WorkContext, but collected AFTER signup
  companyDivision: string | null // Optional grouping layer
  firebaseId: string
  email: string | null
}

/**
 * Verify Firebase token from Request Authorization header
 * Fetches WorkMe from database
 * 
 * @param request - Next.js Request object (for API routes)
 * @throws Error if token is missing, invalid, or user not found
 * @returns {VerifiedAuth} Authenticated user context
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

    // Get WorkMe record by firebaseId
    const workMe = await prisma.workMe.findUnique({
      where: { firebaseId: decodedToken.uid },
      select: {
        id: true,
        firebaseId: true,
        email: true,
        companyUnit: true,
        companyDivision: true,
      },
    })

    if (!workMe) {
      throw new Error('Unauthorized: WorkMe record not found. Please complete sign up.')
    }

    return {
      workMeId: workMe.id,
      companyUnit: workMe.companyUnit,
      companyDivision: workMe.companyDivision,
      firebaseId: decodedToken.uid,
      email: decodedToken.email || workMe.email,
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

