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
  companyId: string | null      // Authoritative organizational FK
  companyUnit: string | null    // Optional string label ("SEA 05", "NAVSEA HQ")
  division: string | null       // Optional string label
}

/**
 * Load WorkMe identity by Firebase ID (MVP1 Architecture)
 * 
 * Returns ONLY what is stored directly on WorkMe record.
 * NO membership resolution, NO unit lookups, NO relational navigation.
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
      companyId: true,
      companyUnit: true,
      division: true,
    },
  })

  if (!workMe) {
    throw new Error('WorkMe identity not found. Please complete sign up.')
  }

  return {
    id: workMe.id,
    firebaseId: workMe.firebaseId,
    email: workMe.email,
    firstName: null, // Will be populated from WorkProfile when available
    lastName: null,  // Will be populated from WorkProfile when available
    photoUrl: null,   // Will be populated from WorkProfile when available
    companyId: workMe.companyId,
    companyUnit: workMe.companyUnit,
    division: workMe.division,
  }
}

