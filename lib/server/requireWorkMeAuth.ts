/**
 * requireWorkMeAuth - WorkMe-only authentication helper
 * 
 * AUTH = WorkMeID only. No companyUnit, no tenant resolution, no employment checks.
 * 
 * This is the canonical auth pattern for all /api/workstuff/** routes.
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import { NextRequest } from 'next/server'
import { verifyAuth } from './verifyAuth'
import { prisma } from '@/lib/prisma'

export interface WorkMeAuth {
  id: string
  firebaseId: string
  email: string
}

/**
 * Require WorkMe authentication from Firebase token
 * 
 * @param req - Next.js Request object
 * @returns {WorkMeAuth} WorkMe identity (id, firebaseId, email)
 * @throws Error if token is missing, invalid, or WorkMe not found
 */
export async function requireWorkMeAuth(req: NextRequest): Promise<WorkMeAuth> {
  // 1. Verify Firebase token
  const { firebaseId } = await verifyAuth(req as Request)
  
  // 2. Load WorkMe by firebaseId
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

  return {
    id: workMe.id,
    firebaseId: workMe.firebaseId!,
    email: workMe.email,
  }
}

