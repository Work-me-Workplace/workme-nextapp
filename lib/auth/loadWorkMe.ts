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

  // Fetch WorkProfile and current WorkEntry
  const [profile, currentWorkEntry] = await Promise.all([
    prisma.workProfile.findUnique({
      where: { userId: workMe.id },
    }),
    prisma.workEntry.findFirst({
      where: {
        userId: workMe.id,
        endDate: null, // Current job
      },
      include: {
        companyUnit: {
          select: {
            name: true,
          },
        },
      },
    }),
  ])

  return {
    id: workMe.id,
    firebaseId: workMe.firebaseId,
    email: workMe.email,
    firstName: profile?.firstName || null,
    lastName: profile?.lastName || null,
    photoUrl: profile?.profileImage || null,
    companyUnit: currentWorkEntry?.companyUnit.name || null,
    companyDivision: currentWorkEntry?.division || null,
  }
}

