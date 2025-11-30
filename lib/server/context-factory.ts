"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ContextType } from "@/lib/types/context-type"

// Model map for CompanyX models
const MODEL_MAP = {
  campaign: "companyCampaign",
  impact_event: "companyImpactEvent",
  training: "companyTraining",
  event: "companyEvent",
  community: "companyCommunity",
  benefits: "companyBenefits",
  career: "companyCareer",
  employee_cause: "companyEmployeeCause",
} as const

type ModelMapKey = keyof typeof MODEL_MAP

/**
 * Create a CompanyX model directly (no router needed)
 * 
 * @param type - The context type (campaign, event, etc.)
 * @param data - The typed context data (validated by schema)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyUnit - The authenticated user's company unit (required for multi-tenant)
 */
export async function createTypedContext(
  type: ContextType,
  data: Record<string, any>,
  workMeId: string,
  companyUnit: string | null
) {
  console.log('[CompanyX CREATE]', {
    type,
    payload: data,
    workMeId,
    companyUnit,
  })

  if (!workMeId) {
    console.error('[CompanyX CREATE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyUnit) {
    console.error('[CompanyX CREATE] ERROR: No companyUnit - user must set a companyUnit before creating work items')
    throw new Error("User must set a companyUnit before creating work items")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[CompanyX CREATE] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    // Create CompanyX model directly with createdByWorkMeId
    const typed = await (prisma as any)[modelName].create({
      data: {
        ...data,
        companyUnit,
        createdByWorkMeId: workMeId,
      },
    })

    console.log('[CompanyX CREATE] SUCCESS', {
      type,
      typedId: typed.id,
      workMeId,
      companyUnit,
    })

    return { typed, success: true as const }
  } catch (error: any) {
    console.error('[CompanyX CREATE] ERROR', {
      type,
      workMeId,
      companyUnit,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Update a CompanyX model directly
 * Validates ownership and company scoping before updating
 * 
 * @param companyXId - The CompanyX model ID
 * @param type - The context type
 * @param data - The updated typed context data (validated by schema)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyUnit - The authenticated user's company unit (required for multi-tenant)
 */
export async function updateTypedContext(
  companyXId: string,
  type: ContextType,
  data: Record<string, any>,
  workMeId: string,
  companyUnit: string | null
) {
  console.log('[CompanyX UPDATE]', {
    companyXId,
    type,
    payload: data,
    workMeId,
    companyUnit,
  })

  if (!workMeId) {
    console.error('[CompanyX UPDATE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyUnit) {
    console.error('[CompanyX UPDATE] ERROR: No companyUnit - user must set a companyUnit')
    throw new Error("User must set a companyUnit")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[CompanyX UPDATE] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    // Update CompanyX model directly (validate ownership via companyUnit)
    const typed = await (prisma as any)[modelName].update({
      where: { 
        id: companyXId,
        companyUnit, // Multi-tenant: ensure same company unit
      },
      data,
    })

    console.log('[CompanyX UPDATE] SUCCESS', {
      companyXId,
      type,
      typedId: typed.id,
      workMeId,
      companyUnit,
    })

    return { typed, success: true as const }
  } catch (error: any) {
    console.error('[CompanyX UPDATE] ERROR', {
      companyXId,
      type,
      workMeId,
      companyUnit,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Get CompanyX model data by type and ID
 * Filters by companyUnit for multi-tenant security
 * 
 * @param type - The context type
 * @param companyXId - The CompanyX model ID
 * @param companyUnit - The company unit to scope the query (required for multi-tenant)
 */
export async function getTypedContext(
  type: ContextType,
  companyXId: string,
  companyUnit: string | null
) {
  console.log('[CompanyX GET_TYPED]', {
    type,
    companyXId,
    companyUnit,
  })

  if (!companyUnit) {
    console.error('[CompanyX GET_TYPED] ERROR: No companyUnit - user must set a companyUnit')
    throw new Error("User must set a companyUnit")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[CompanyX GET_TYPED] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    const typed = await (prisma as any)[modelName].findFirst({
      where: { 
        id: companyXId,
        companyUnit, // Multi-tenant: ensure same company unit
      },
    })

    console.log('[CompanyX GET_TYPED] SUCCESS', {
      type,
      companyXId,
      companyUnit,
      found: !!typed,
      title: typed?.title || 'N/A',
    })

    return typed
  } catch (error: any) {
    console.error('[CompanyX GET_TYPED] ERROR', {
      type,
      companyXId,
      companyUnit,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Delete a CompanyX model directly
 * Validates ownership and company scoping before deleting
 * 
 * @param companyXId - The CompanyX model ID
 * @param type - The context type
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyUnit - The authenticated user's company unit (required for multi-tenant)
 */
export async function deleteTypedContext(
  companyXId: string,
  type: ContextType,
  workMeId: string,
  companyUnit: string | null
) {
  console.log('[CompanyX DELETE]', {
    companyXId,
    type,
    workMeId,
    companyUnit,
  })

  if (!workMeId) {
    console.error('[CompanyX DELETE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyUnit) {
    console.error('[CompanyX DELETE] ERROR: No companyUnit - user must set a companyUnit')
    throw new Error("User must set a companyUnit")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[CompanyX DELETE] ERROR: Invalid context type', {
      companyXId,
      type,
    })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    // Delete CompanyX model directly (validate ownership via companyUnit)
    await (prisma as any)[modelName].delete({
      where: { 
        id: companyXId,
        companyUnit, // Multi-tenant: ensure same company unit
      },
    })

    console.log('[CompanyX DELETE] SUCCESS', {
      companyXId,
      type,
      workMeId,
      companyUnit,
    })

    return { success: true as const }
  } catch (error: any) {
    console.error('[CompanyX DELETE] ERROR', {
      companyXId,
      type,
      workMeId,
      companyUnit,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

