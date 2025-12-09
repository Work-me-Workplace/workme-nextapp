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
 * 
 * ✅ CANONICAL ARCHITECTURE:
 * - Employee carries the canonical org metadata (companyUnitId)
 * - Highlight inherits from Employee via CompanyEmployeeHighlightLink
 * - Unit scoping is inferred from Employee → companyUnitId
 * - No need to store companyUnit separately on highlight
 * 
 * Flow:
 * 1. Create highlight (no companyUnit field)
 * 2. Link highlight ↔ employee (via CompanyEmployeeHighlightLink)
 * 3. Unit is inferred from employee.companyUnitId
 */
export async function createHighlight(
  data: CreateHighlightData,
  workMeId: string,
  companyUnit: string | null // Used for authorization/validation only, not stored
) {
  console.log('[createHighlight]', {
    workMeId,
    companyUnit,
    fullName: data.fullName,
    unit: data.unit, // Employee's unit (from parser, never overridden)
  })

  if (!workMeId) {
    throw new Error('workMeId is required')
  }

  // ✅ Create highlight with only valid fields (exclude fullName, title, unit - those are employee fields)
  // ✅ Unit scoping is inferred from employee, not stored on highlight
  const highlight = await prisma.companyEmployeeHighlight.create({
    data: {
      citationText: data.citationText,
      achievement: data.achievement || null,
      narrative: data.narrative || null,
      classification: data.classification || null,
      awardName: data.awardName || null,
      awardingAgency: data.awardingAgency || null,
      awardYear: data.awardYear || null,
      supervisorQuote: data.supervisorQuote || null,
      photoUrl: data.photoUrl || null,
      createdByWorkMeId: workMeId,
    },
  })

  // Note: Employee linking and unit inference happens in the calling code
  // Employee → belongs to unit
  // Highlight → belongs to employee
  // Therefore Highlight → unit is inferred

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

  // Only update valid fields (exclude fullName, title, unit - those are employee fields)
  const {
    fullName,
    title,
    unit,
    ...validFields
  } = data

  const updated = await prisma.companyEmployeeHighlight.update({
    where: { id },
    data: validFields,
  })

  console.log('[updateHighlight] SUCCESS', { highlightId: id })

  return updated
}

/**
 * Get a single highlight by ID
 * Includes employee and unit relations
 */
export async function getHighlight(id: string) {
  console.log('[getHighlight]', { id })

  const highlight = await prisma.companyEmployeeHighlight.findUnique({
    where: { id },
    include: {
      employees: {
        include: {
          employee: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  })

  if (!highlight) {
    throw new Error('Highlight not found')
  }

  return highlight
}

/**
 * List all highlights for a company (MVP1 Architecture)
 * 
 * Filters by companyId for organizational scoping.
 * Optionally filters by companyUnit string label if provided.
 */
export async function listHighlights(companyId: string | null, companyUnit?: string | null) {
  console.log('[listHighlights]', { companyId, companyUnit })

  if (!companyId) {
    return []
  }

  // Filter by companyId (authoritative) and optional companyUnit string
  const highlights = await prisma.companyEmployeeHighlight.findMany({
    where: {
      employees: {
        some: {
          employee: {
            companyId,
            ...(companyUnit ? { companyUnit } : {}),
          },
        },
      },
    },
    include: {
      employees: {
        include: {
          employee: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return highlights
}

