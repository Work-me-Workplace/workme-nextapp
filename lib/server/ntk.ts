/**
 * NTK (Need to Know) Server Actions
 * 
 * Standalone NTK model CRUD operations
 * Uses ntkId as primary key
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from './verifyAuth'
import type { NTKStructure } from '@/lib/services/ntk-generator'

// Zod schema for creating/updating NTK
const createNTKSchema = z.object({
  header: z.string().min(1, 'Header is required'),
  poc: z.string().min(1, 'POC is required'),
  summary: z.string().min(1, 'Summary is required'),
  sourceText: z.string().optional(),
  draftContent: z.any().optional(),
  metadata: z.any().optional(),
})

const updateNTKSchema = createNTKSchema.partial().extend({
  ntkId: z.string().min(1, 'NTK ID is required'),
})

/**
 * Create a new NTK
 */
export async function createNTK(
  data: z.infer<typeof createNTKSchema>,
  workMeId: string,
  companyUnit: string | null,
  companyDivision: string | null = null
) {
  console.log('[NTK CREATE]', {
    header: data.header,
    workMeId,
    companyUnit,
    companyDivision,
  })

  if (!workMeId) {
    throw new Error('No WorkMeId - not authenticated')
  }

  if (!companyUnit) {
    throw new Error('User must set a companyUnit before creating work items')
  }

  const validated = createNTKSchema.parse(data)

  const ntk = await prisma.nTK.create({
    data: {
      header: validated.header,
      poc: validated.poc,
      summary: validated.summary,
      sourceText: validated.sourceText ?? undefined,
      draftContent: validated.draftContent ?? undefined,
      metadata: validated.metadata ?? undefined,
      companyUnit,
      companyDivision,
      originatorId: workMeId,
    },
  })

  console.log('[NTK CREATE] SUCCESS', {
    ntkId: ntk.ntkId,
  })

  return {
    success: true as const,
    ntkId: ntk.ntkId,
    ntk,
  }
}

/**
 * Update an existing NTK
 */
export async function updateNTK(
  data: z.infer<typeof updateNTKSchema>,
  workMeId: string,
  companyUnit: string | null
) {
  console.log('[NTK UPDATE]', {
    ntkId: data.ntkId,
    workMeId,
    companyUnit,
  })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  const validated = updateNTKSchema.parse(data)
  const { ntkId, ...updateData } = validated

  // Verify ownership
  const existing = await prisma.nTK.findFirst({
    where: {
      ntkId,
      companyUnit,
      originatorId: workMeId,
    },
  })

  if (!existing) {
    throw new Error('NTK not found or unauthorized')
  }

  const updated = await prisma.nTK.update({
    where: { ntkId },
    data: updateData,
  })

  console.log('[NTK UPDATE] SUCCESS', {
    ntkId: updated.ntkId,
  })

  return {
    success: true as const,
    ntk: updated,
  }
}

/**
 * Get a single NTK by ID
 */
export async function getNTK(ntkId: string, workMeId: string, companyUnit: string | null) {
  console.log('[NTK GET]', { ntkId, workMeId, companyUnit })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  const ntk = await prisma.nTK.findFirst({
    where: {
      ntkId,
      companyUnit, // Multi-tenant scoping
    },
  })

  if (!ntk) {
    throw new Error('NTK not found')
  }

  // Optional: verify ownership (or allow company-wide access)
  // if (ntk.originatorId !== workMeId) {
  //   throw new Error('NTK not found or unauthorized')
  // }

  console.log('[NTK GET] SUCCESS', { ntkId })

  return {
    success: true as const,
    ntk,
  }
}

/**
 * List all NTKs for a company unit
 */
export async function listNTKs(companyUnit: string | null) {
  console.log('[NTK LIST]', { companyUnit })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  const ntks = await prisma.nTK.findMany({
    where: {
      companyUnit, // Multi-tenant scoping
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      ntkId: true,
      header: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      originatorId: true,
    },
  })

  console.log('[NTK LIST] SUCCESS', {
    count: ntks.length,
  })

  return {
    success: true as const,
    data: ntks,
  }
}

/**
 * Delete an NTK
 */
export async function deleteNTK(ntkId: string, workMeId: string, companyUnit: string | null) {
  console.log('[NTK DELETE]', { ntkId, workMeId, companyUnit })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  // Verify ownership
  const existing = await prisma.nTK.findFirst({
    where: {
      ntkId,
      companyUnit,
      originatorId: workMeId,
    },
  })

  if (!existing) {
    throw new Error('NTK not found or unauthorized')
  }

  await prisma.nTK.delete({
    where: { ntkId },
  })

  console.log('[NTK DELETE] SUCCESS', { ntkId })

  return {
    success: true as const,
    message: 'NTK deleted successfully',
  }
}

