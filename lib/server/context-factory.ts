"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ContextType } from "@prisma/client"

// Model map for typed context models
const MODEL_MAP = {
  campaign: "workContextCampaign",
  impact_event: "workContextImpactEvent",
  training: "workContextTraining",
  event: "workEvent",
  community: "workContextCommunity",
  benefits: "workContextBenefits",
  career: "workContextCareer",
  employee_cause: "workContextEmployeeCause",
} as const

type ModelMapKey = keyof typeof MODEL_MAP

/**
 * Create a typed context with transaction safety
 * Creates both the typed model and the WorkEventRouter router entry atomically
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
  console.log('[WorkEventRouter CREATE]', {
    type,
    payload: data,
    workMeId,
    companyId,
  })

  if (!workMeId) {
    console.error('[WorkEventRouter CREATE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error('[WorkEventRouter CREATE] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[WorkEventRouter CREATE] ERROR: Invalid context type', { type })
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

      // Create WorkEventRouter router entry
      const router = await tx.workEventRouter.create({
        data: {
          type,
          eventRefId: typed.id,
          companyId,
          originatorId: workMeId,
        },
      })

      return { typed, router, success: true as const }
    })

    console.log('[WorkEventRouter CREATE] SUCCESS', {
      type,
      typedId: result.typed.id,
      routerId: result.router.id,
      workMeId,
      companyId,
    })

    return result
  } catch (error: any) {
    console.error('[WorkEventRouter CREATE] ERROR', {
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
 * @param workEventRouterId - The WorkEventRouter router ID
 * @param type - The context type (must match router.type)
 * @param data - The updated typed context data (validated by schema)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function updateTypedContext(
  workEventRouterId: string,
  type: ContextType,
  data: Record<string, any>,
  workMeId: string,
  companyId: string
) {
  console.log('[WorkEventRouter UPDATE]', {
    workEventRouterId,
    type,
    payload: data,
    workMeId,
    companyId,
  })

  if (!workMeId) {
    console.error('[WorkEventRouter UPDATE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error('[WorkEventRouter UPDATE] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[WorkEventRouter UPDATE] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Validate ownership, company scoping, and get router entry
      const router = await tx.workEventRouter.findFirst({
        where: { 
          id: workEventRouterId,
          companyId, // Multi-tenant: ensure same company
          originatorId: workMeId,
          type, // Ensure type matches
        },
      })

      if (!router) {
        console.error('[WorkEventRouter UPDATE] ERROR: Router not found or unauthorized', {
          workEventRouterId,
          workMeId,
          companyId,
          type,
        })
        throw new Error("Router not found or unauthorized")
      }

      // Update typed model
      const typed = await (tx as any)[modelName].update({
        where: { id: router.eventRefId },
        data,
      })

      return { router, typed, success: true as const }
    })

    console.log('[WorkEventRouter UPDATE] SUCCESS', {
      workEventRouterId,
      type,
      typedId: result.typed.id,
      routerId: result.router.id,
      workMeId,
      companyId,
    })

    return result
  } catch (error: any) {
    console.error('[WorkEventRouter UPDATE] ERROR', {
      workEventRouterId,
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
 * Get typed context data by type and eventRefId
 * Filters by companyId for multi-tenant security
 * 
 * @param type - The context type
 * @param eventRefId - The typed context model ID
 * @param companyId - The company ID to scope the query (required for multi-tenant)
 */
export async function getTypedContext(
  type: ContextType,
  eventRefId: string,
  companyId: string
) {
  console.log('[WorkEventRouter GET_TYPED]', {
    type,
    eventRefId,
    companyId,
  })

  if (!companyId) {
    console.error('[WorkEventRouter GET_TYPED] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    console.error('[WorkEventRouter GET_TYPED] ERROR: Invalid context type', { type })
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  try {
    const typed = await (prisma as any)[modelName].findFirst({
      where: { 
        id: eventRefId,
        companyId, // Multi-tenant: ensure same company
      },
    })

    console.log('[WorkEventRouter GET_TYPED] SUCCESS', {
      type,
      eventRefId,
      companyId,
      found: !!typed,
      title: typed?.title || 'N/A',
    })

    return typed
  } catch (error: any) {
    console.error('[WorkEventRouter GET_TYPED] ERROR', {
      type,
      eventRefId,
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
 * @param workEventRouterId - The WorkEventRouter router ID
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function deleteTypedContext(
  workEventRouterId: string,
  workMeId: string,
  companyId: string
) {
  console.log('[WorkEventRouter DELETE]', {
    workEventRouterId,
    workMeId,
    companyId,
  })

  if (!workMeId) {
    console.error('[WorkEventRouter DELETE] ERROR: No WorkMeId - not authenticated')
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error('[WorkEventRouter DELETE] ERROR: No CompanyId - user must belong to a company')
    throw new Error("User must belong to a company")
  }

  // Get router entry to determine type (with company scoping)
  const router = await prisma.workEventRouter.findFirst({
    where: { 
      id: workEventRouterId,
      companyId, // Multi-tenant: ensure same company
      originatorId: workMeId,
    },
  })

  if (!router) {
    console.error('[WorkEventRouter DELETE] ERROR: Router not found or unauthorized', {
      workEventRouterId,
      workMeId,
      companyId,
    })
    throw new Error("Router not found or unauthorized")
  }

  if (!MODEL_MAP[router.type as ModelMapKey]) {
    console.error('[WorkEventRouter DELETE] ERROR: Invalid context type', {
      workEventRouterId,
      type: router.type,
    })
    throw new Error(`Invalid context type: ${router.type}`)
  }

  const modelName = MODEL_MAP[router.type as ModelMapKey]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Delete typed model first (child)
      await (tx as any)[modelName].delete({
        where: { id: router.eventRefId },
      })

      // Delete router entry (parent)
      await tx.workEventRouter.delete({
        where: { id: workEventRouterId },
      })

      return { success: true as const }
    })

    console.log('[WorkEventRouter DELETE] SUCCESS', {
      workEventRouterId,
      type: router.type,
      typedId: router.eventRefId,
      workMeId,
      companyId,
    })

    return result
  } catch (error: any) {
    console.error('[WorkEventRouter DELETE] ERROR', {
      workEventRouterId,
      workMeId,
      companyId,
      type: router.type,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

