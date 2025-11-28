import { prisma } from "@/lib/prisma"
import { getTypedContext } from "./context-factory"
import type { ContextType } from "@/lib/types/context-type"

/**
 * Get and enrich a CompanyX model with typed data
 * Filters by companyId for multi-tenant security
 * Returns null if not found or unauthorized
 * 
 * NOTE: This is NOT a server action (no "use server") to avoid conflicts.
 * Use getWorkContext from lib/actions/work-context.ts for server actions.
 * 
 * @param id - The CompanyX model ID
 * @param type - The context type (campaign, event, etc.)
 * @param companyId - The company ID to scope the query (required for multi-tenant)
 */
export async function getCompanyX(
  id: string,
  type: ContextType,
  companyId: string
) {
  console.log('[CompanyX GET]', {
    companyXId: id,
    type,
    companyId,
  })

  if (!companyId) {
    console.error('[CompanyX GET] ERROR: No companyId - user must belong to a company', {
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
      companyId,
    })
    return null
  }

  console.log('[CompanyX GET] Looking up model', {
    companyXId: id,
    type,
    modelName,
    companyId,
  })

  // Get CompanyX model directly with company scoping (multi-tenant security)
  const companyX = await (prisma as any)[modelName].findFirst({
    where: { 
      id,
      companyId, // Multi-tenant: ensure same company
    },
  })

  if (!companyX) {
    console.error('[CompanyX GET] ERROR: Model not found', {
      companyXId: id,
      type,
      modelName,
      companyId,
    })
    return null
  }

  console.log('[CompanyX GET] Model found', {
    companyXId: companyX.id,
    type,
    title: companyX.title,
    companyId,
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
    companyId,
  })

  return result
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use getCompanyX instead
 */
export const getWorkEventRouter = getCompanyX

