/**
 * Server-only: Get WorkMe ID from request headers, cookies, or Firebase auth
 * This should be called from server actions or API routes
 */

'use server'

import { cookies, headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

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

  // Try to get from Firebase ID token (if available in headers)
  // This requires Firebase Admin SDK setup
  // For now, try to get firebaseId from headers/cookies
  const firebaseId = cookieStore.get('firebaseId')?.value || headersList.get('x-firebase-id')
  
  if (firebaseId) {
    try {
      // Look up WorkMe by firebaseId
      const workMe = await prisma.workMe.findUnique({
        where: { firebaseId },
        select: { id: true },
      })
      
      if (workMe) {
        return workMe.id
      }
    } catch (error) {
      console.error('Error looking up WorkMe by firebaseId:', error)
    }
  }

  // Fallback: return null if not found
  return null
}

