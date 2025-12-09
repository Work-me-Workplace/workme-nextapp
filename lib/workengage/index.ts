/**
 * WorkEngage - Engagement Messaging Module
 * 
 * Server functions for engagement messaging, templates, and highlights
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
 */
export async function createMessage(
  data: CreateEngageMessageData,
  ownerId: string
) {
  console.log('[workEngage.createMessage]', {
    ownerId,
    templateId: data.templateId,
    highlightId: data.highlightId,
  })

  if (!ownerId) {
    throw new Error('ownerId is required')
  }

  if (!data.message || data.message.trim().length === 0) {
    throw new Error('message is required')
  }

  const engageMessage = await prisma.engageMessage.create({
    data: {
      message: data.message,
      templateId: data.templateId || null,
      highlightId: data.highlightId || null,
      ownerId,
    },
    include: {
      template: true,
      highlight: {
        include: {
          employees: {
            include: {
              employee: true,
            },
          },
        },
      },
    },
  })

  console.log('[workEngage.createMessage] SUCCESS', { messageId: engageMessage.id })

  return engageMessage
}

/**
 * Get all templates
 */
export async function getTemplates() {
  console.log('[workEngage.getTemplates]')

  const templates = await prisma.engageTemplate.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  return templates
}

/**
 * Get highlights (reads from CompanyEmployeeHighlight)
 * Returns highlights with employee information
 */
export async function getHighlights(companyUnit?: string | null) {
  console.log('[workEngage.getHighlights]', { companyUnit })

  const where: any = {}
  
  // If companyUnit provided, filter by it via junction table
  if (companyUnit) {
    where.units = {
      some: {
        companyUnit: companyUnit,
      },
    }
  }

  const highlights = await prisma.companyEmployeeHighlight.findMany({
    where,
    include: {
      employees: {
        include: {
          employee: true,
        },
      },
      units: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50, // Limit to recent highlights
  })

  return highlights
}

/**
 * Get engagement message history for an owner
 */
export async function getHistory(ownerId: string) {
  console.log('[workEngage.getHistory]', { ownerId })

  if (!ownerId) {
    throw new Error('ownerId is required')
  }

  const messages = await prisma.engageMessage.findMany({
    where: {
      ownerId,
    },
    include: {
      template: true,
      highlight: {
        include: {
          employees: {
            include: {
              employee: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return messages
}

/**
 * Hydrate template with highlight data
 * 
 * Replaces placeholders:
 * - {{employeeName}} → highlight.employee.fullName
 * - {{highlightTitle}} → highlight.achievement or highlight.citationText
 * - {{highlightDescription}} → highlight.narrative or highlight.citationText
 * - {{date}} → highlight.createdAt (formatted)
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

  // Get employee name (from first linked employee)
  const employeeName = highlight.employees?.[0]?.employee?.fullName || 'the employee'
  
  // Get highlight title (prefer achievement, fallback to citationText)
  const highlightTitle = highlight.achievement || highlight.citationText || 'their achievement'
  
  // Get highlight description (prefer narrative, fallback to citationText)
  const highlightDescription = highlight.narrative || highlight.citationText || 'their work'

  // Format date
  const date = highlight.createdAt
    ? new Date(highlight.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'recently'

  // Replace placeholders
  hydrated = hydrated.replace(/\{\{employeeName\}\}/g, employeeName)
  hydrated = hydrated.replace(/\{\{highlightTitle\}\}/g, highlightTitle)
  hydrated = hydrated.replace(/\{\{highlightDescription\}\}/g, highlightDescription)
  hydrated = hydrated.replace(/\{\{date\}\}/g, date)

  return hydrated
}

/**
 * Create a new template
 */
export async function createTemplate(data: EngageTemplateData) {
  console.log('[workEngage.createTemplate]', { name: data.name })

  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Template name is required')
  }

  if (!data.body || data.body.trim().length === 0) {
    throw new Error('Template body is required')
  }

  const template = await prisma.engageTemplate.create({
    data: {
      name: data.name,
      body: data.body,
    },
  })

  console.log('[workEngage.createTemplate] SUCCESS', { templateId: template.id })

  return template
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string) {
  console.log('[workEngage.getTemplate]', { id })

  const template = await prisma.engageTemplate.findUnique({
    where: { id },
  })

  if (!template) {
    throw new Error('Template not found')
  }

  return template
}

/**
 * Get a single highlight by ID (for hydration)
 */
export async function getHighlightForHydration(id: string) {
  console.log('[workEngage.getHighlightForHydration]', { id })

  const highlight = await prisma.companyEmployeeHighlight.findUnique({
    where: { id },
    include: {
      employees: {
        include: {
          employee: true,
        },
      },
    },
  })

  if (!highlight) {
    throw new Error('Highlight not found')
  }

  return highlight
}

