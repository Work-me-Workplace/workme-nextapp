/**
 * Company Employee Highlights Service
 * 
 * Database service functions for CompanyEmployeeHighlight model
 */

import { prisma } from '@/lib/prisma'

export interface CreateHighlightData {
  fullName: string
  title?: string | null
  unit?: string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  citationText: string
  achievement?: string | null
  narrative?: string | null
  classification?: string | null
  photoUrl?: string | null
  supervisorQuote?: string | null
}

export interface UpdateHighlightData extends Partial<CreateHighlightData> {
  // All fields optional for update
}

/**
 * Create a new employee highlight
 */
export async function createHighlight(
  data: CreateHighlightData,
  workMeId: string,
  companyUnit: string | null
) {
  console.log('[createHighlight]', {
    workMeId,
    companyUnit,
    fullName: data.fullName,
  })

  if (!workMeId) {
    throw new Error('workMeId is required')
  }

  const highlight = await prisma.companyEmployeeHighlight.create({
    data: {
      ...data,
      companyUnit,
      createdByWorkMeId: workMeId,
    },
  })

  console.log('[createHighlight] SUCCESS', { highlightId: highlight.id })

  return highlight
}

/**
 * Update an existing employee highlight
 */
export async function updateHighlight(
  id: string,
  data: UpdateHighlightData,
  workMeId: string
) {
  console.log('[updateHighlight]', {
    id,
    workMeId,
  })

  // Verify ownership
  const existing = await prisma.companyEmployeeHighlight.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('Highlight not found')
  }

  if (existing.createdByWorkMeId !== workMeId) {
    throw new Error('Unauthorized: You can only edit highlights you created')
  }

  const updated = await prisma.companyEmployeeHighlight.update({
    where: { id },
    data,
  })

  console.log('[updateHighlight] SUCCESS', { highlightId: id })

  return updated
}

/**
 * Get a single highlight by ID
 */
export async function getHighlight(id: string) {
  console.log('[getHighlight]', { id })

  const highlight = await prisma.companyEmployeeHighlight.findUnique({
    where: { id },
  })

  if (!highlight) {
    throw new Error('Highlight not found')
  }

  return highlight
}

/**
 * List all highlights for a company unit
 */
export async function listHighlights(companyUnit: string | null) {
  console.log('[listHighlights]', { companyUnit })

  if (!companyUnit) {
    return []
  }

  const highlights = await prisma.companyEmployeeHighlight.findMany({
    where: {
      companyUnit,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return highlights
}

