'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'

// WorkOutput types registry
export const WORK_OUTPUT_TYPES = [
  { value: 'ntk_snippet', label: 'NTK Snippet (Workforce Email)' },
  { value: 'talking_points', label: 'Talking Points' },
  { value: 'digital_signage', label: 'Digital Signage' },
  { value: 'print_product', label: 'Print Product' },
  { value: 'sharepoint_block', label: 'SharePoint Block' },
  { value: 'quick_blurb', label: 'Quick Blurb' },
  { value: 'event_kit', label: 'Event Kit' },
  { value: 'photo_video', label: 'Photo & Video' },
] as const

export const WORK_OUTPUT_TYPE_VALUES = WORK_OUTPUT_TYPES.map(t => t.value)

// Internal Comms Modules (Static Registry - for documentation/display)
export const INTERNAL_COMMS_MODULES = [
  'Workforce Communications',
  'Messaging & Talking Points',
  'Digital Products',
  'Print Products',
  'SharePoint / Web Publishing',
  'Photography & Videography',
]

const workSupportSchema = z.object({
  contextId: z.string().min(1, 'Context ID is required'),
  supportType: z.string().optional().nullable(),
  selectedOutputs: z.array(z.enum(WORK_OUTPUT_TYPE_VALUES as [string, ...string[]])).optional().default([]),
  evolvingInfo: z.any().optional().nullable(),
  assets: z.any().optional().nullable(),
  status: z.enum(['draft', 'in_progress', 'complete']).default('draft'),
})

export async function createWorkSupport(data: z.infer<typeof workSupportSchema>) {
  try {
    const validated = workSupportSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    // Check if WorkSupport already exists for this context
    const existing = await prisma.workSupport.findFirst({
      where: { 
        contextId: validated.contextId,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (existing) {
      return { success: false, error: 'WorkSupport already exists for this context' }
    }

    // Verify context exists and belongs to user's company
    const context = await prisma.workContext.findFirst({
      where: { 
        id: validated.contextId,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (!context) {
      return { success: false, error: 'WorkContext not found or unauthorized' }
    }

    const support = await prisma.workSupport.create({
      data: {
        ...validated,
        supportType: validated.supportType ?? undefined,
        selectedOutputs: validated.selectedOutputs || [],
        evolvingInfo: validated.evolvingInfo ?? undefined,
        assets: validated.assets ?? undefined,
        companyId,
        originatorId: workMeId,
      },
      include: {
        context: true,
      },
    })

    return { success: true, support }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating WorkSupport:', error)
    return { success: false, error: 'Failed to create WorkSupport' }
  }
}

export async function updateWorkSupport(id: string, data: Partial<z.infer<typeof workSupportSchema>>) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    // Verify ownership and company scoping
    const existing = await prisma.workSupport.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
        originatorId: workMeId,
      },
    })

    if (!existing) {
      return { success: false, error: 'WorkSupport not found' }
    }

    const updateData: any = {}
    if (data.selectedOutputs !== undefined) updateData.selectedOutputs = data.selectedOutputs
    if (data.evolvingInfo !== undefined) updateData.evolvingInfo = data.evolvingInfo ?? undefined
    if (data.assets !== undefined) updateData.assets = data.assets ?? undefined
    if (data.status !== undefined) updateData.status = data.status
    if (data.supportType !== undefined) updateData.supportType = data.supportType ?? undefined

    const support = await prisma.workSupport.update({
      where: { id },
      data: updateData,
      include: {
        context: true,
        outputs: true,
      },
    })

    return { success: true, support }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error updating WorkSupport:', error)
    return { success: false, error: 'Failed to update WorkSupport' }
  }
}

export async function getWorkSupport(id: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    const support = await prisma.workSupport.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
      },
      include: {
        context: true,
        outputs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!support) {
      return { success: false, error: 'WorkSupport not found' }
    }

    return { success: true, support }
  } catch (error) {
    console.error('Error fetching WorkSupport:', error)
    return { success: false, error: 'Failed to fetch WorkSupport' }
  }
}

export async function getWorkSupportByContext(contextId: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    // Verify context belongs to user's company
    const context = await prisma.workContext.findFirst({
      where: { 
        id: contextId,
        companyId, // Multi-tenant: ensure same company
      },
    })

    if (!context) {
      return { success: false, error: 'WorkContext not found or unauthorized' }
    }

    const support = await prisma.workSupport.findFirst({
      where: { 
        contextId,
        companyId, // Multi-tenant: ensure same company
      },
      include: {
        context: true,
        outputs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return { success: true, support }
  } catch (error) {
    console.error('Error fetching WorkSupport by context:', error)
    return { success: false, error: 'Failed to fetch WorkSupport' }
  }
}

export async function deleteWorkSupport(id: string) {
  try {
    const { workMeId, companyId } = await verifyAuth()

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or user must belong to a company' }
    }

    // Verify ownership and company scoping
    const existing = await prisma.workSupport.findFirst({
      where: { 
        id,
        companyId, // Multi-tenant: ensure same company
        originatorId: workMeId,
      },
    })

    if (!existing) {
      return { success: false, error: 'WorkSupport not found' }
    }

    await prisma.workSupport.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting WorkSupport:', error)
    return { success: false, error: 'Failed to delete WorkSupport' }
  }
}

