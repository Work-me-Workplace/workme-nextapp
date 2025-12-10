/**
 * WorkEngage - Engagement Messaging Module
 * 
 * Simple service for engagement messaging, templates, and highlights
 */

import { prisma } from '@/lib/prisma'

export interface CreateEngageMessageData {
  message: string
  templateId?: string | null
  highlightId?: string | null
}

export interface EngageTemplateData {
  name: string
  body: string
}

/**
 * Create a new engagement message
 * Just creates the message - no over-fetching
 */
export async function createMessage(
  data: CreateEngageMessageData,
  ownerId: string
) {
  if (!ownerId) {
    throw new Error('ownerId is required')
  }

  if (!data.message || data.message.trim().length === 0) {
    throw new Error('message is required')
  }

  return await prisma.engageMessage.create({
    data: {
      message: data.message,
      templateId: data.templateId || null,
      highlightId: data.highlightId || null,
      ownerId,
    },
  })
}

/**
 * Get engagement message history for an owner
 */
export async function getHistory(ownerId: string) {
  if (!ownerId) {
    throw new Error('ownerId is required')
  }

  return await prisma.engageMessage.findMany({
    where: { ownerId },
    include: {
      template: true,
      highlight: {
        include: {
          employees: {
            include: {
              employee: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get all templates
 */
export async function getTemplates() {
  return await prisma.engageTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Create a new template
 */
export async function createTemplate(data: EngageTemplateData) {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Template name is required')
  }

  if (!data.body || data.body.trim().length === 0) {
    throw new Error('Template body is required')
  }

  return await prisma.engageTemplate.create({
    data: {
      name: data.name,
      body: data.body,
    },
  })
}

/**
 * Get highlights with employee info
 */
export async function getHighlights() {
  return await prisma.companyEmployeeHighlight.findMany({
    include: {
      employees: {
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

/**
 * Get a single highlight by ID for hydration
 */
export async function getHighlightForHydration(id: string) {
  const highlight = await prisma.companyEmployeeHighlight.findUnique({
    where: { id },
    include: {
      employees: {
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
            },
          },
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
 * Hydrate template with highlight data
 * 
 * Replaces placeholders:
 * - {{employeeName}} → employee fullName
 * - {{highlightTitle}} → achievement or citationText
 * - {{highlightDescription}} → narrative or citationText
 * - {{date}} → createdAt (formatted)
 */
export function hydrateTemplate(
  templateBody: string,
  highlight?: {
    employees?: Array<{
      employee: {
        fullName: string
      }
    }>
    achievement?: string | null
    citationText?: string
    narrative?: string | null
    createdAt?: Date
  } | null
): string {
  if (!highlight) {
    return templateBody
  }

  let hydrated = templateBody

  const employeeName = highlight.employees?.[0]?.employee?.fullName || 'the employee'
  const highlightTitle = highlight.achievement || highlight.citationText || 'their achievement'
  const highlightDescription = highlight.narrative || highlight.citationText || 'their work'
  const date = highlight.createdAt
    ? new Date(highlight.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'recently'

  hydrated = hydrated.replace(/\{\{employeeName\}\}/g, employeeName)
  hydrated = hydrated.replace(/\{\{highlightTitle\}\}/g, highlightTitle)
  hydrated = hydrated.replace(/\{\{highlightDescription\}\}/g, highlightDescription)
  hydrated = hydrated.replace(/\{\{date\}\}/g, date)

  return hydrated
}
