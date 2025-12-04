/**
 * Load WorkMe identity by Firebase ID
 * 
 * This is the app-level identity resolver after Firebase authentication
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import { prisma } from '@/lib/prisma'

export interface WorkMeIdentity {
  id: string
  firebaseId: string | null
  email: string
  firstName: string | null
  lastName: string | null
  photoUrl: string | null
  companyUnit: string | null // From current WorkEntry
  companyDivision: string | null // From current WorkEntry
}

/**
 * Load WorkMe identity by Firebase ID
 * 
 * Simplified - just returns the WorkMe object without related data
 * This avoids errors when WorkEntry/WorkProfile tables don't exist yet
 * 
 * @param firebaseId - Firebase user ID from verifyAuth
 * @throws Error if WorkMe record not found
 * @returns {WorkMeIdentity} WorkMe identity data
 */
export async function loadWorkMe(firebaseId: string): Promise<WorkMeIdentity> {
  const workMe = await prisma.workMe.findUnique({
    where: { firebaseId },
    select: {
      id: true,
      firebaseId: true,
      email: true,
    },
  })

  if (!workMe) {
    throw new Error('WorkMe identity not found. Please complete sign up.')
  }

  // Just return basic WorkMe - no WorkEntry/WorkProfile queries
  // This keeps it simple and avoids errors when tables don't exist
  return {
    id: workMe.id,
    firebaseId: workMe.firebaseId,
    email: workMe.email,
    firstName: null, // Will be populated from WorkProfile when available
    lastName: null,  // Will be populated from WorkProfile when available
    photoUrl: null,   // Will be populated from WorkProfile when available
    companyUnit: null, // Will be populated from WorkEntry when available
    companyDivision: null, // Will be populated from WorkEntry when available
  }
}

