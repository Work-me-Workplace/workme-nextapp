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
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function createStandaloneOutput(
  data: z.infer<typeof createStandaloneOutputSchema>,
  workMeId: string,
  companyId: string
) {
  console.log(`[StandaloneOutput CREATE] type=${data.outputType} payload=${JSON.stringify(data)} workMeId=${workMeId} companyId=${companyId}`)

  if (!workMeId) {
    console.error(`[StandaloneOutput CREATE] ERROR: No WorkMeId - not authenticated`)
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error(`[StandaloneOutput CREATE] ERROR: No CompanyId - user must belong to a company`)
    throw new Error("User must belong to a company")
  }

  try {
    const validated = createStandaloneOutputSchema.parse(data)
    
    const result = await prisma.workOutputStandalone.create({
      data: {
        ...validated,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    console.log(`[StandaloneOutput CREATE] SUCCESS type=${data.outputType} outputId=${result.id} workMeId=${workMeId} companyId=${companyId}`)

    return {
      success: true,
      operation: "create",
      outputType: result.outputType,
      outputId: result.id,
      message: `${result.outputType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} created.`,
      data: result,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput CREATE] ERROR type=${data.outputType} workMeId=${workMeId} companyId=${companyId} error=${error.message}`)
    throw error
  }
}

/**
 * Update a standalone output
 * 
 * @param data - The output data (validated by schema, must include id)
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function updateStandaloneOutput(
  data: z.infer<typeof updateStandaloneOutputSchema>,
  workMeId: string,
  companyId: string
) {
  console.log(`[StandaloneOutput UPDATE] id=${data.id} payload=${JSON.stringify(data)} workMeId=${workMeId} companyId=${companyId}`)

  if (!workMeId) {
    console.error(`[StandaloneOutput UPDATE] ERROR: No WorkMeId - not authenticated`)
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error(`[StandaloneOutput UPDATE] ERROR: No CompanyId - user must belong to a company`)
    throw new Error("User must belong to a company")
  }

  try {
    const validated = updateStandaloneOutputSchema.parse(data)
    const { id, ...updateData } = validated

    // Verify ownership and company scoping (multi-tenant security)
    const existing = await prisma.workOutputStandalone.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (!existing) {
      console.error(`[StandaloneOutput UPDATE] ERROR: Output not found or unauthorized id=${id} workMeId=${workMeId} companyId=${companyId}`)
      throw new Error("Output not found or unauthorized")
    }

    if (existing.createdByWorkMeId !== workMeId) {
      console.error(`[StandaloneOutput UPDATE] ERROR: Unauthorized id=${id} workMeId=${workMeId} owner=${existing.createdByWorkMeId} companyId=${companyId}`)
      throw new Error("Unauthorized")
    }

    const result = await prisma.workOutputStandalone.update({
      where: { id },
      data: updateData,
    })

    console.log(`[StandaloneOutput UPDATE] SUCCESS id=${id} workMeId=${workMeId} companyId=${companyId}`)

    return {
      success: true,
      operation: "update",
      outputType: result.outputType,
      outputId: result.id,
      message: `${result.outputType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} updated.`,
      data: result,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput UPDATE] ERROR id=${data.id} workMeId=${workMeId} companyId=${companyId} error=${error.message}`)
    throw error
  }
}

/**
 * Get a standalone output by ID
 * Filters by companyId for multi-tenant security
 * 
 * @param id - The output ID
 * @param companyId - The company ID to scope the query (required for multi-tenant)
 */
export async function getStandaloneOutput(id: string, companyId: string) {
  console.log(`[StandaloneOutput GET] id=${id} companyId=${companyId}`)

  if (!companyId) {
    console.error(`[StandaloneOutput GET] ERROR: No CompanyId - user must belong to a company`)
    throw new Error("User must belong to a company")
  }

  try {
    const result = await prisma.workOutputStandalone.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (!result) {
      console.error(`[StandaloneOutput GET] ERROR: Output not found or unauthorized id=${id} companyId=${companyId}`)
      throw new Error("Output not found or unauthorized")
    }

    console.log(`[StandaloneOutput GET] SUCCESS id=${id} companyId=${companyId}`)

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput GET] ERROR id=${id} companyId=${companyId} error=${error.message}`)
    throw error
  }
}

/**
 * List all standalone outputs for the authenticated user's company
 * Filters by companyId for multi-tenant security
 * 
 * @param companyId - The company ID to scope the query (required for multi-tenant)
 */
export async function listStandaloneOutputs(companyId: string) {
  console.log(`[StandaloneOutput LIST] companyId=${companyId}`)

  if (!companyId) {
    console.error(`[StandaloneOutput LIST] ERROR: No CompanyId - user must belong to a company`)
    throw new Error("User must belong to a company")
  }

  try {
    const results = await prisma.workOutputStandalone.findMany({
      where: {
        companyId, // Multi-tenant: filter by company
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    console.log(`[StandaloneOutput LIST] SUCCESS companyId=${companyId} count=${results.length}`)

    return {
      success: true,
      data: results,
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput LIST] ERROR companyId=${companyId} error=${error.message}`)
    throw error
  }
}

/**
 * Delete a standalone output
 * Validates ownership and company scoping before deletion
 * 
 * @param id - The output ID
 * @param workMeId - The authenticated user's WorkMe ID
 * @param companyId - The authenticated user's Company ID (required for multi-tenant)
 */
export async function deleteStandaloneOutput(
  id: string,
  workMeId: string,
  companyId: string
) {
  console.log(`[StandaloneOutput DELETE] id=${id} workMeId=${workMeId} companyId=${companyId}`)

  if (!workMeId) {
    console.error(`[StandaloneOutput DELETE] ERROR: No WorkMeId - not authenticated`)
    throw new Error("No WorkMeId - not authenticated")
  }

  if (!companyId) {
    console.error(`[StandaloneOutput DELETE] ERROR: No CompanyId - user must belong to a company`)
    throw new Error("User must belong to a company")
  }

  try {
    // Verify ownership and company scoping (multi-tenant security)
    const existing = await prisma.workOutputStandalone.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (!existing) {
      console.error(`[StandaloneOutput DELETE] ERROR: Output not found or unauthorized id=${id} workMeId=${workMeId} companyId=${companyId}`)
      throw new Error("Output not found or unauthorized")
    }

    if (existing.createdByWorkMeId !== workMeId) {
      console.error(`[StandaloneOutput DELETE] ERROR: Unauthorized id=${id} workMeId=${workMeId} owner=${existing.createdByWorkMeId} companyId=${companyId}`)
      throw new Error("Unauthorized")
    }

    await prisma.workOutputStandalone.delete({
      where: { id },
    })

    console.log(`[StandaloneOutput DELETE] SUCCESS id=${id} workMeId=${workMeId} companyId=${companyId}`)

    return {
      success: true,
      operation: "delete",
      outputId: id,
      message: "Output deleted.",
    }
  } catch (error: any) {
    console.error(`[StandaloneOutput DELETE] ERROR id=${id} workMeId=${workMeId} companyId=${companyId} error=${error.message}`)
    throw error
  }
}

