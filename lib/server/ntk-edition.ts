/**
 * NTK Edition & Item Server Actions
 * 
 * Handles NTKEdition (parent) and NTKItem (child) CRUD operations
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from './verifyAuth'
import { NTKStatus } from '@prisma/client'
import type { PreviewRow } from '@/lib/services/ntk-csv-pipeline'

// Zod schemas
const createEditionSchema = z.object({
  title: z.string().optional(),
  date: z.string().datetime().optional(),
})

const updateItemSchema = z.object({
  itemId: z.string().min(1),
  feedback: z.string().optional(),
  plainLanguage: z.string().optional(),
  status: z.nativeEnum(NTKStatus).optional(),
})

/**
 * Create a new NTKEdition with items from preview rows
 */
export async function createEdition(
  previewRows: PreviewRow[],
  workMeId: string,
  companyUnit: string | null,
  companyDivision: string | null = null,
  title?: string,
  date?: Date,
) {
  console.log('[NTK Edition CREATE]', {
    itemCount: previewRows.length,
    workMeId,
    companyUnit,
    companyDivision,
    title,
  })

  if (!workMeId) {
    throw new Error('No WorkMeId - not authenticated')
  }

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  if (!previewRows || previewRows.length === 0) {
    throw new Error('No preview rows provided')
  }

  // Create edition and items in a transaction
  const edition = await prisma.nTKEdition.create({
    data: {
      title: title || undefined,
      date: date || undefined,
      originatorId: workMeId,
      companyUnit,
      companyDivision,
      items: {
        create: previewRows.map((row) => ({
          inputId: row.inputId,
          rawFields: row.rawFields,
          validated: true,
          status: NTKStatus.VALIDATED,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  console.log('[NTK Edition CREATE] SUCCESS', {
    editionId: edition.id,
    itemCount: edition.items.length,
  })

  return {
    success: true as const,
    editionId: edition.id,
    edition,
  }
}

/**
 * Get a single NTKEdition by ID with all items
 */
export async function getEdition(
  editionId: string,
  workMeId: string,
  companyUnit: string | null,
) {
  console.log('[NTK Edition GET]', { editionId, workMeId, companyUnit })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  const edition = await prisma.nTKEdition.findFirst({
    where: {
      id: editionId,
      companyUnit, // Multi-tenant scoping
    },
    include: {
      items: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      originator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  if (!edition) {
    throw new Error('Edition not found')
  }

  console.log('[NTK Edition GET] SUCCESS', {
    editionId,
    itemCount: edition.items.length,
  })

  return {
    success: true as const,
    edition,
  }
}

/**
 * List all NTKEditions for a company
 */
export async function listEditions(companyUnit: string | null) {
  console.log('[NTK Edition LIST]', { companyUnit })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  const editions = await prisma.nTKEdition.findMany({
    where: {
      companyUnit,
    },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
      originator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  console.log('[NTK Edition LIST] SUCCESS', {
    count: editions.length,
  })

  return {
    success: true as const,
    data: editions,
  }
}

/**
 * Get a single NTKItem by ID
 */
export async function getItem(
  itemId: string,
  workMeId: string,
  companyUnit: string | null,
) {
  console.log('[NTK Item GET]', { itemId, workMeId, companyUnit })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  const item = await prisma.nTKItem.findFirst({
    where: {
      id: itemId,
      edition: {
        companyUnit, // Multi-tenant scoping
      },
    },
    include: {
      edition: {
        select: {
          id: true,
          title: true,
          date: true,
          companyUnit: true,
          companyDivision: true,
        },
      },
    },
  })

  if (!item) {
    throw new Error('Item not found')
  }

  console.log('[NTK Item GET] SUCCESS', { itemId })

  return {
    success: true as const,
    item,
  }
}

/**
 * Update an NTKItem (regenerate with feedback, update status, etc.)
 */
export async function updateItem(
  data: z.infer<typeof updateItemSchema>,
  workMeId: string,
  companyUnit: string | null,
) {
  console.log('[NTK Item UPDATE]', {
    itemId: data.itemId,
    workMeId,
    companyUnit,
    hasFeedback: !!data.feedback,
    newStatus: data.status,
  })

  if (!companyUnit) {
    throw new Error('User must set a companyUnit')
  }

  const validated = updateItemSchema.parse(data)
  const { itemId, ...updateData } = validated

  // Verify ownership through edition
  const existing = await prisma.nTKItem.findFirst({
    where: {
      id: itemId,
      edition: {
        companyUnit,
      },
    },
  })

  if (!existing) {
    throw new Error('Item not found or unauthorized')
  }

  // Update item
  const updated = await prisma.nTKItem.update({
    where: { id: itemId },
    data: {
      ...(updateData.feedback !== undefined && { feedback: updateData.feedback }),
      ...(updateData.plainLanguage !== undefined && {
        plainLanguage: updateData.plainLanguage,
      }),
      ...(updateData.status !== undefined && { status: updateData.status }),
      updatedAt: new Date(),
    },
  })

  console.log('[NTK Item UPDATE] SUCCESS', {
    itemId: updated.id,
    status: updated.status,
  })

  return {
    success: true as const,
    item: updated,
  }
}

/**
 * Mark an item as FINAL
 */
export async function markItemFinal(
  itemId: string,
  workMeId: string,
  companyUnit: string | null,
) {
  return updateItem(
    {
      itemId,
      status: NTKStatus.FINAL,
    },
    workMeId,
    companyUnit,
  )
}

