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
 * ✅ CANONICAL RULES:
 * - companyUnit = creator's companyUnit (scoping dimension)
 * - unit = employee's actual org (from parser/user input, NEVER overridden)
 * - DO NOT auto-assign unit from creator's companyUnit
 * - DO NOT overwrite unit with creator's unit
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
    unit: data.unit, // Employee's unit (from parser, never overridden)
  })

  if (!workMeId) {
    throw new Error('workMeId is required')
  }

  // ✅ unit comes from data (parser/user input) - NEVER override
  // ✅ companyUnit comes from creator - scoping dimension only
  const highlight = await prisma.companyEmployeeHighlight.create({
    data: {
      ...data, // Includes unit from parser (employee's org)
      companyUnit, // Creator's companyUnit (scoping)
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
 * 
 * ✅ CANONICAL RULE: Scope queries to companyUnit ONLY (creator's companyUnit)
 * ❌ DO NOT filter by unit (employee's org) - that's just metadata
 */
export async function listHighlights(companyUnit: string | null) {
  console.log('[listHighlights]', { companyUnit })

  if (!companyUnit) {
    return []
  }

  // ✅ Filter by companyUnit (creator's scoping dimension)
  // ❌ NOT by unit (employee's org - that's just metadata)
  const highlights = await prisma.companyEmployeeHighlight.findMany({
    where: {
      companyUnit, // Creator's companyUnit (scoping)
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return highlights
}

