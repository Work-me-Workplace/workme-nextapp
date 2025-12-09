/**
 * Server-side helper to get WorkMe context for route operations
 * 
 * Use this in routes to get workMeId, companyId, and workMeCompanyId
 * for stamping objects with organizational context.
 * 
 * Pattern:
 * const workme = await getWorkMeContext(request)
 * // workme.workMeId - for createdByWorkMeId
 * // workme.companyId - for companyId FK (authoritative)
 * // workme.workMeCompanyId - for background tagging
 */

'use server'

import { NextRequest } from 'next/server'
import { verifyAuth } from './verifyAuth'
import { prisma } from '@/lib/prisma'

export interface WorkMeContext {
  workMeId: string
  companyId: string | null
  companyUnit: string | null
  division: string | null
  workMeCompanyId: string | null
}

/**
 * Get WorkMe context from authenticated request
 * 
 * @param request - Next.js Request object
 * @returns {WorkMeContext} Context values for route operations
 * @throws Error if WorkMe not found
 */
export async function getWorkMeContext(request: NextRequest): Promise<WorkMeContext> {
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

