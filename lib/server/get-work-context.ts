import { prisma } from "@/lib/prisma"
import { getTypedContext } from "./context-factory"
import type { ContextType } from "@/lib/types/context-type"

/**
 * Get and enrich a CompanyX model with typed data
 * Filters by companyUnit for multi-tenant security
 * Returns null if not found or unauthorized
 * 
 * NOTE: This is NOT a server action (no "use server") to avoid conflicts.
 * Use getWorkContext from lib/actions/work-context.ts for server actions.
 * 
 * @param id - The CompanyX model ID
 * @param type - The context type (campaign, event, etc.)
 * @param companyUnit - The company unit to scope the query (required for multi-tenant)
 */
export async function getCompanyX(
  id: string,
  type: ContextType,
  companyUnit: string | null
) {
  console.log('[CompanyX GET]', {
    companyXId: id,
    type,
    companyUnit,
  })

  if (!companyUnit) {
    console.error('[CompanyX GET] ERROR: No companyUnit - user must set a companyUnit', {
      companyXId: id,
      type,
    })
    return null
  }

  // Map type to model name
  const modelMap: Record<ContextType, string> = {
    campaign: 'companyCampaign',
    impact_event: 'companyImpactEvent',
    training: 'companyTraining',
    event: 'companyEvent',
    community: 'companyCommunity',
    benefits: 'companyBenefits',
    career: 'companyCareer',
    employee_cause: 'companyEmployeeCause',
  }

  const modelName = modelMap[type]
  if (!modelName) {
    console.error('[CompanyX GET] ERROR: Invalid context type', {
      companyXId: id,
      type,
      companyUnit,
    })
    return null
  }

  console.log('[CompanyX GET] Looking up model', {
    companyXId: id,
    type,
    modelName,
    companyUnit,
  })

  // Get CompanyX model directly with company scoping (multi-tenant security)
  const companyX = await (prisma as any)[modelName].findFirst({
    where: { 
      id,
      companyUnit, // Multi-tenant: ensure same company unit
    },
  })

  if (!companyX) {
    console.error('[CompanyX GET] ERROR: Model not found', {
      companyXId: id,
      type,
      modelName,
      companyUnit,
    })
    return null
  }

  console.log('[CompanyX GET] Model found', {
    companyXId: companyX.id,
    type,
    title: companyX.title,
    companyUnit,
  })

  // Enrich with typed data (already have it, just format)
  const result = {
    ...companyX,
    type,
    typedData: companyX,
    title: companyX.title ?? "",
  }

  console.log('[CompanyX GET] SUCCESS', {
    companyXId: companyX.id,
    type,
    title: result.title,
    companyUnit,
  })

  return result
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getCompanyX instead
 */
export const getWorkEventRouter = getCompanyX

