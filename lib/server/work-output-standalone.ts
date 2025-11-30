"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { OutputCategory } from "@prisma/client"

// Zod schema for creating/updating standalone outputs
const createStandaloneOutputSchema = z.object({
  outputType: z.enum([
    "workforce_comms_email",
    "messaging_talking_points",
    "digital_product",
    "print_product",
    "sharepoint_update",
    "photo_video_support",
    "ntk",
  ]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  draftContent: z.any().optional(), // JSON field
  metadata: z.any().optional(), // JSON field
  workSupportId: z.string().optional(),
})

const updateStandaloneOutputSchema = createStandaloneOutputSchema.partial().extend({
  id: z.string(),
})

/**
 * Create a standalone output
 * 
 * @param data - The output data (validated by schema)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyUnit - The authenticated user's company unit (required for multi-tenant)
 */
export async function createStandaloneOutput(
  data: z.infer<typeof createStandaloneOutputSchema>,
  workMeId: string,
  companyUnit: string | null
) {
  console.log(`[StandaloneOutput CREATE] type=${data.outputType} payload=${JSON.stringify(data)} workMeId=${workMeId} companyUnit=${companyUnit}`)

  if (!workMeId) {
    console.error(`[StandaloneOutput CREATE] ERROR: No WorkMeId - not authenticated`)
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyUnit) {
    console.error(`[StandaloneOutput CREATE] ERROR: No companyUnit - user must set a companyUnit before creating work items`)
    throw new Error("User must set a companyUnit before creating work items")
  }

  try {
    const validated = createStandaloneOutputSchema.parse(data)
    
    const result = await prisma.workOutputStandalone.create({
      data: {
        ...validated,
        companyUnit,
        originatorId: workMeId,
      },
    })

    console.log(`[StandaloneOutput CREATE] SUCCESS type=${data.outputType} outputId=${result.id} workMeId=${workMeId} companyUnit=${companyUnit}`)

    return {
      success: true,
      operation: "create",
      outputType: result.outputType,
      outputId: result.id,
      message: `${result.outputType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} created.`,
      data: result,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput CREATE] ERROR type=${data.outputType} workMeId=${workMeId} companyUnit=${companyUnit} error=${error.message}`)
    throw error
  }
}

/**
 * Update a standalone output
 * 
 * @param data - The output data (validated by schema, must include id)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyUnit - The authenticated user's company unit (required for multi-tenant)
 */
export async function updateStandaloneOutput(
  data: z.infer<typeof updateStandaloneOutputSchema>,
  workMeId: string,
  companyUnit: string | null
) {
  console.log(`[StandaloneOutput UPDATE] id=${data.id} payload=${JSON.stringify(data)} workMeId=${workMeId} companyUnit=${companyUnit}`)

  if (!workMeId) {
    console.error(`[StandaloneOutput UPDATE] ERROR: No WorkMeId - not authenticated`)
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyUnit) {
    console.error(`[StandaloneOutput UPDATE] ERROR: No companyUnit - user must set a companyUnit`)
    throw new Error("User must belong to a company")
  }

  try {
    const validated = updateStandaloneOutputSchema.parse(data)
    const { id, ...updateData } = validated

    // Verify ownership and company scoping (multi-tenant security)
    const existing = await prisma.workOutputStandalone.findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant: ensure same company unit
      },
    })

    if (!existing) {
      console.error(`[StandaloneOutput UPDATE] ERROR: Output not found or unauthorized id=${id} workMeId=${workMeId} companyUnit=${companyUnit}`)
      throw new Error("Output not found or unauthorized")
    }

    if (existing.originatorId !== workMeId) {
      console.error(`[StandaloneOutput UPDATE] ERROR: Unauthorized id=${id} workMeId=${workMeId} owner=${existing.originatorId} companyUnit=${companyUnit}`)
      throw new Error("Unauthorized")
    }

    const result = await prisma.workOutputStandalone.update({
      where: { id },
      data: updateData,
    })

    console.log(`[StandaloneOutput UPDATE] SUCCESS id=${id} workMeId=${workMeId} companyUnit=${companyUnit}`)

    return {
      success: true,
      operation: "update",
      outputType: result.outputType,
      outputId: result.id,
      message: `${result.outputType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} updated.`,
      data: result,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput UPDATE] ERROR id=${data.id} workMeId=${workMeId} companyUnit=${companyUnit} error=${error.message}`)
    throw error
  }
}

/**
 * Get a standalone output by ID
 * Filters by companyUnit for multi-tenant security
 * 
 * @param id - The output ID
 * @param companyUnit - The company unit to scope the query (required for multi-tenant)
 */
export async function getStandaloneOutput(id: string, companyUnit: string | null) {
  console.log(`[StandaloneOutput GET] id=${id} companyUnit=${companyUnit}`)

  if (!companyUnit) {
    console.error(`[StandaloneOutput GET] ERROR: No companyUnit - user must set a companyUnit`)
    throw new Error("User must set a companyUnit")
  }

  try {
    const result = await prisma.workOutputStandalone.findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant: ensure same company unit
      },
    })

    if (!result) {
      console.error(`[StandaloneOutput GET] ERROR: Output not found or unauthorized id=${id} companyUnit=${companyUnit}`)
      throw new Error("Output not found or unauthorized")
    }

    console.log(`[StandaloneOutput GET] SUCCESS id=${id} companyUnit=${companyUnit}`)

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput GET] ERROR id=${id} companyUnit=${companyUnit} error=${error.message}`)
    throw error
  }
}

/**
 * List all standalone outputs for the authenticated user's company unit
 * Filters by companyUnit for multi-tenant security
 * 
 * @param companyUnit - The company unit to scope the query (required for multi-tenant)
 */
export async function listStandaloneOutputs(companyUnit: string | null) {
  console.log(`[StandaloneOutput LIST] companyUnit=${companyUnit}`)

  if (!companyUnit) {
    console.error(`[StandaloneOutput LIST] ERROR: No companyUnit - user must set a companyUnit`)
    throw new Error("User must set a companyUnit")
  }

  try {
    const results = await prisma.workOutputStandalone.findMany({
      where: {
        companyUnit, // Multi-tenant: filter by company unit
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    console.log(`[StandaloneOutput LIST] SUCCESS companyUnit=${companyUnit} count=${results.length}`)

    return {
      success: true,
      data: results,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput LIST] ERROR companyUnit=${companyUnit} error=${error.message}`)
    throw error
  }
}

/**
 * Delete a standalone output
 * Validates ownership and company scoping before deletion
 * 
 * @param id - The output ID
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyUnit - The authenticated user's company unit (required for multi-tenant)
 */
export async function deleteStandaloneOutput(
  id: string,
  workMeId: string,
  companyUnit: string | null
) {
  console.log(`[StandaloneOutput DELETE] id=${id} workMeId=${workMeId} companyUnit=${companyUnit}`)

  if (!workMeId) {
    console.error(`[StandaloneOutput DELETE] ERROR: No WorkMeId - not authenticated`)
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyUnit) {
    console.error(`[StandaloneOutput DELETE] ERROR: No companyUnit - user must set a companyUnit`)
    throw new Error("User must set a companyUnit")
  }

  try {
    // Verify ownership and company scoping (multi-tenant security)
    const existing = await prisma.workOutputStandalone.findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant: ensure same company unit
      },
    })

    if (!existing) {
      console.error(`[StandaloneOutput DELETE] ERROR: Output not found or unauthorized id=${id} workMeId=${workMeId} companyUnit=${companyUnit}`)
      throw new Error("Output not found or unauthorized")
    }

    if (existing.originatorId !== workMeId) {
      console.error(`[StandaloneOutput DELETE] ERROR: Unauthorized id=${id} workMeId=${workMeId} owner=${existing.originatorId} companyUnit=${companyUnit}`)
      throw new Error("Unauthorized")
    }

    await prisma.workOutputStandalone.delete({
      where: { id },
    })

    console.log(`[StandaloneOutput DELETE] SUCCESS id=${id} workMeId=${workMeId} companyUnit=${companyUnit}`)

    return {
      success: true,
      operation: "delete",
      outputId: id,
      message: "Output deleted.",
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput DELETE] ERROR id=${id} workMeId=${workMeId} companyUnit=${companyUnit} error=${error.message}`)
    throw error
  }
}

