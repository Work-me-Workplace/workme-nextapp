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
  // First, find the CompanyUnit by name to get its ID
  const companyUnitRecord = await prisma.companyUnit.findUnique({
    where: { name: companyUnit },
    select: { id: true },
  })

  if (!companyUnitRecord) {
    throw new Error(`CompanyUnit "${companyUnit}" not found`)
  }

  // Then use the ID with the unique constraint
  const membership = await prisma.companyUnitMembers.findUnique({
    where: {
      workMeId_companyUnitId: {
        workMeId,
        companyUnitId: companyUnitRecord.id,
      },
    },
  })

  if (!membership) {
    throw new Error(`Access denied: not a member of companyUnit "${companyUnit}"`)
  }

  // Map Prisma result to Membership interface (companyUnitId -> companyUnit name)
  return {
    id: membership.id,
    workMeId: membership.workMeId,
    companyUnit: companyUnit, // Use the name passed as parameter
    role: membership.role,
    createdAt: membership.createdAt,
  }
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

