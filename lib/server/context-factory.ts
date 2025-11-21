"use server"

import { prisma } from "@/lib/prisma"
import { getWorkMeId } from "@/lib/getWorkMeId.server"
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
 */
export async function createTypedContext(
  type: ContextType,
  data: Record<string, any>
) {
  const workMeId = await getWorkMeId()
  if (!workMeId) {
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  return prisma.$transaction(async (tx) => {
    // Create typed model
    const typed = await (tx as any)[modelName].create({
      data: {
        ...data,
        createdByWorkMeId: workMeId,
      },
    })

    // Create WorkContext router entry
    const router = await tx.workContext.create({
      data: {
        type,
        typeRefId: typed.id,
        createdByWorkMeId: workMeId,
      },
    })

    return { typed, router, success: true as const }
  })
}

/**
 * Update a typed context with transaction safety
 * Validates ownership before updating
 */
export async function updateTypedContext(
  workContextId: string,
  type: ContextType,
  data: Record<string, any>
) {
  const workMeId = await getWorkMeId()
  if (!workMeId) {
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!MODEL_MAP[type as ModelMapKey]) {
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  return prisma.$transaction(async (tx) => {
    // Validate ownership and get router entry
    const router = await tx.workContext.findFirst({
      where: { 
        id: workContextId, 
        createdByWorkMeId: workMeId,
        type, // Ensure type matches
      },
    })

    if (!router) {
      throw new Error("Context not found or unauthorized")
    }

    // Update typed model
    const typed = await (tx as any)[modelName].update({
      where: { id: router.typeRefId },
      data,
    })

    return { router, typed, success: true as const }
  })
}

/**
 * Get typed context data by type and typeRefId
 */
export async function getTypedContext(
  type: ContextType,
  typeRefId: string
) {
  if (!MODEL_MAP[type as ModelMapKey]) {
    throw new Error(`Invalid context type: ${type}`)
  }

  const modelName = MODEL_MAP[type as ModelMapKey]

  return (prisma as any)[modelName].findUnique({
    where: { id: typeRefId },
  })
}

/**
 * Delete a typed context with transaction safety
 * Validates ownership and deletes both router and typed model atomically
 */
export async function deleteTypedContext(workContextId: string) {
  const workMeId = await getWorkMeId()
  if (!workMeId) {
    throw new Error("No WorkMeId - not authenticated")
  }

  // Get router entry to determine type
  const router = await prisma.workContext.findFirst({
    where: { 
      id: workContextId, 
      createdByWorkMeId: workMeId,
    },
  })

  if (!router) {
    throw new Error("Context not found or unauthorized")
  }

  if (!MODEL_MAP[router.type as ModelMapKey]) {
    throw new Error(`Invalid context type: ${router.type}`)
  }

  const modelName = MODEL_MAP[router.type as ModelMapKey]

  return prisma.$transaction(async (tx) => {
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
}

