/**
 * Server-side helper to get WorkMe scoping values
 * 
 * Use this in routes to get workMeId, companyId, and workMeCompanyId
 * for stamping objects with organizational context.
 * 
 * Pattern:
 * const scope = await getWorkMeScope(request)
 * // scope.workMeId - for createdByWorkMeId
 * // scope.companyId - for companyId FK
 * // scope.workMeCompanyId - for background tagging
 */

'use server'

import { NextRequest } from 'next/server'
import { verifyAuth } from './verifyAuth'
import { prisma } from '@/lib/prisma'

export interface WorkMeScope {
  workMeId: string
  companyId: string | null
  companyUnit: string | null
  division: string | null
  workMeCompanyId: string | null
}

/**
 * Get WorkMe scoping values from authenticated request
 * 
 * @param request - Next.js Request object
 * @returns {WorkMeScope} Scoping values for route operations
 * @throws Error if WorkMe not found
 */
export async function getWorkMeScope(request: NextRequest): Promise<WorkMeScope> {
  // 1. Verify Firebase token
  const { firebaseId } = await verifyAuth(request as Request)
  
  // 2. Get WorkMe scoping fields
  const workMe = await prisma.workMe.findUnique({
    where: { firebaseId },
    select: {
      id: true,
      companyId: true,
      companyUnit: true,
      division: true,
      workMeCompanyId: true,
    },
  })

  if (!workMe) {
    throw new Error('WorkMe identity not found. Please complete sign up.')
  }

  return {
    workMeId: workMe.id,
    companyId: workMe.companyId,
    companyUnit: workMe.companyUnit,
    division: workMe.division,
    workMeCompanyId: workMe.workMeCompanyId,
  }
}

// Legacy export for backward compatibility
export const getWorkMeScope = getWorkMeContext
export type WorkMeScope = WorkMeContext

