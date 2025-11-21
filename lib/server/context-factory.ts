"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ContextType } from "@prisma/client"

// Model map for typed context models
const MODEL_MAP = {
  campaign: "workContextCampaign",
  impact_event: "workContextImpactEvent",
  training: "workContextTraining",
  event: "workContextEvent",
  community: "workContextCommunity",
  benefits: "workContextBenefits",
  career: "workContextCareer",
  employee_cause: "workContextEmployeeCause",
} as const

type ModelMapKey = keyof typeof MODEL_MAP

/**
 * Create a typed context with transaction safety
 * Creates both the typed model and the WorkContext router entry atomically
 * 
 * @param type - The context type (campaign, event, etc.)
 * @param data - The typed context data (validated by schema)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function createTypedContext(
  type: ContextType,
  data: Record<string, any>,
  workMeId: string,
  companyId: string
) {
  console.log('[WorkContext CREATE]', {
    type,
    payload: data,
    workMeId,
    companyId,
  })

  if (!workMeId) {
    console.error('[WorkContext CREATE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error('[WorkContext CREATE] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[WorkContext CREATE] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create typed model
      const typed = await (tx as any)[modelName].create({
        data: {
          ...data,
          companyId,
          originatorId: workMeId,
        },
      })

      // Create WorkContext router entry
      const router = await tx.workContext.create({
        data: {
          type,
          typeRefId: typed.id,
          companyId,
          originatorId: workMeId,
        },
      })

      return { typed, router, success: true as const }
    })

    console.log('[WorkContext CREATE] SUCCESS', {
      type,
      typedId: result.typed.id,
      routerId: result.router.id,
      workMeId,
      companyId,
    })

    return result
  } catch (error: any) {
    console.error('[WorkContext CREATE] ERROR', {
      type,
      workMeId,
      companyId,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Update a typed context with transaction safety
 * Validates ownership and company scoping before updating
 * 
 * @param workContextId - The WorkContext router ID
 * @param type - The context type (must match router.type)
 * @param data - The updated typed context data (validated by schema)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function updateTypedContext(
  workContextId: string,
  type: ContextType,
  data: Record<string, any>,
  workMeId: string,
  companyId: string
) {
  console.log('[WorkContext UPDATE]', {
    workContextId,
    type,
    payload: data,
    workMeId,
    companyId,
  })

  if (!workMeId) {
    console.error('[WorkContext UPDATE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error('[WorkContext UPDATE] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[WorkContext UPDATE] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate ownership, company scoping, and get router entry
      const router = await tx.workContext.findFirst({
        where: { 
          id: workContextId,
          companyId, // Multi-tenant: ensure same company
          originatorId: workMeId,
          type, // Ensure type matches
        },
      })

      if (!router) {
        console.error('[WorkContext UPDATE] ERROR: Context not found or unauthorized', {
          workContextId,
          workMeId,
          companyId,
          type,
        })
        throw new Error("Context not found or unauthorized")
      }

      // Update typed model
      const typed = await (tx as any)[modelName].update({
        where: { id: router.typeRefId },
        data,
      })

      return { router, typed, success: true as const }
    })

    console.log('[WorkContext UPDATE] SUCCESS', {
      workContextId,
      type,
      typedId: result.typed.id,
      routerId: result.router.id,
      workMeId,
      companyId,
    })

    return result
  } catch (error: any) {
    console.error('[WorkContext UPDATE] ERROR', {
      workContextId,
      type,
      workMeId,
      companyId,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Get typed context data by type and typeRefId
 * Filters by companyId for multi-tenant security
 * 
 * @param type - The context type
 * @param typeRefId - The typed context model ID
 * @param companyId - The company ID to scope the query (required for multi-tenant)
 */
export async function getTypedContext(
  type: ContextType,
  typeRefId: string,
  companyId: string
) {
  console.log('[WorkContext GET_TYPED]', {
    type,
    typeRefId,
    companyId,
  })

  if (!companyId) {
    console.error('[WorkContext GET_TYPED] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[WorkContext GET_TYPED] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    const typed = await (prisma as any)[modelName].findFirst({
      where: { 
        id: typeRefId,
        companyId, // Multi-tenant: ensure same company
      },
    })

    console.log('[WorkContext GET_TYPED] SUCCESS', {
      type,
      typeRefId,
      companyId,
      found: !!typed,
      title: typed?.title || 'N/A',
    })

    return typed
  } catch (error: any) {
    console.error('[WorkContext GET_TYPED] ERROR', {
      type,
      typeRefId,
      companyId,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * Delete a typed context with transaction safety
 * Validates ownership, company scoping, and deletes both router and typed model atomically
 * 
 * @param workContextId - The WorkContext router ID
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function deleteTypedContext(
  workContextId: string,
  workMeId: string,
  companyId: string
) {
  console.log('[WorkContext DELETE]', {
    workContextId,
    workMeId,
    companyId,
  })

  if (!workMeId) {
    console.error('[WorkContext DELETE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error('[WorkContext DELETE] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  // Get router entry to determine type (with company scoping)
  const router = await prisma.workContext.findFirst({
    where: { 
      id: workContextId,
      companyId, // Multi-tenant: ensure same company
      originatorId: workMeId,
    },
  })

  if (!router) {
    console.error('[WorkContext DELETE] ERROR: Context not found or unauthorized', {
      workContextId,
      workMeId,
      companyId,
    })
    throw new Error("Context not found or unauthorized")
  }

  if (!MODEL_MAP[router.type as ModelMapKey]) {
    console.error('[WorkContext DELETE] ERROR: Invalid context type', {
      workContextId,
      type: router.type,
    })
    throw new Error(`Invalid context type: ${router.type}`)
  }

  const modelName = MODEL_MAP[router.type as ModelMapKey]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Delete typed model first (child)
      await (tx as any)[modelName].delete({
        where: { id: router.typeRefId },
      })

      // Delete router entry (parent)
      await tx.workContext.delete({
        where: { id: workContextId },
      })

      return { success: true as const }
    })

    console.log('[WorkContext DELETE] SUCCESS', {
      workContextId,
      type: router.type,
      typedId: router.typeRefId,
      workMeId,
      companyId,
    })

    return result
  } catch (error: any) {
    console.error('[WorkContext DELETE] ERROR', {
      workContextId,
      workMeId,
      companyId,
      type: router.type,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

