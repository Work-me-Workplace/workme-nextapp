/**
 * Load CompanyUnit membership and role
 * 
 * Determines permissions and tenant scoping for WorkMe → CompanyUnit
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import { prisma } from '@/lib/prisma'
import { CompanyUnitRole } from '@prisma/client'

export interface Membership {
  id: string
  workMeId: string
  companyUnit: string
  role: CompanyUnitRole
  createdAt: Date
}

/**
 * Load membership for WorkMe in a specific CompanyUnit
 * 
 * @param workMeId - WorkMe ID
 * @param companyUnit - CompanyUnit identifier (references CompanyUnit.unit)
 * @throws Error if membership not found (access denied)
 * @returns {Membership} Membership with role
 */
export async function loadMembership(
  workMeId: string,
  companyUnit: string
): Promise<Membership> {
  const membership = await prisma.companyUnitMembers.findUnique({
    where: {
      workMeId_companyUnit: {
        workMeId,
        companyUnit,
      },
    },
  })

  if (!membership) {
    throw new Error(`Access denied: not a member of companyUnit "${companyUnit}"`)
  }

  return membership
}

/**
 * Check if WorkMe has a specific role in CompanyUnit
 * 
 * @param workMeId - WorkMe ID
 * @param companyUnit - CompanyUnit identifier
 * @param requiredRole - Minimum required role
 * @returns {boolean} True if user has required role or higher
 */
export async function hasRole(
  workMeId: string,
  companyUnit: string,
  requiredRole: CompanyUnitRole
): Promise<boolean> {
  try {
    const membership = await loadMembership(workMeId, companyUnit)
    
    const roleHierarchy: Record<CompanyUnitRole, number> = {
      MEMBER: 1,
      MANAGER: 2,
      ADMIN: 3,
    }

    return roleHierarchy[membership.role] >= roleHierarchy[requiredRole]
  } catch {
    return false
  }
}

