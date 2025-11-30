'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { getWorkMeId } from '@/lib/getWorkMeId.server'
import type { WorkCommsProductType } from '@prisma/client'

// Map old output types to WorkCommsProductType
const OUTPUT_TYPE_MAP: Record<string, WorkCommsProductType> = {
  'ntk_snippet': 'ntk',
  'talking_points': 'talking_points',
  'digital_signage': 'digital_sign',
  'print_product': 'poster', // Default print products to poster
  'sharepoint_block': 'sharepoint',
  'quick_blurb': 'talking_points', // Quick blurbs are talking points
  'event_kit': 'poster', // Event kits default to poster
  'photo_video': 'photo_video',
}

// Legacy output types (for backward compatibility)
export const WORK_OUTPUT_TYPE_VALUES = [
  'ntk_snippet',
  'talking_points',
  'digital_signage',
  'print_product',
  'sharepoint_block',
  'quick_blurb',
  'event_kit',
  'photo_video',
] as [string, ...string[]]

const workProductSchema = z.object({
  // CompanyX linking - one of these should be provided
  companyEventId: z.string().optional().nullable(),
  companyCampaignId: z.string().optional().nullable(),
  companyTrainingId: z.string().optional().nullable(),
  companyBenefitsId: z.string().optional().nullable(),
  companyImpactEventId: z.string().optional().nullable(),
  companyCommunityId: z.string().optional().nullable(),
  companyCareerId: z.string().optional().nullable(),
  companyEmployeeCauseId: z.string().optional().nullable(),
  
  // Product data
  type: z.enum(['email', 'poster', 'ntk', 'digital_sign', 'exec_email', 'flyer', 'sharepoint', 'photo_video', 'talking_points']),
  data: z.any().optional().nullable(),
  metadata: z.any().optional().nullable(),
  
  // Legacy support (for migration)
  legacyOutputType: z.enum(WORK_OUTPUT_TYPE_VALUES as [string, ...string[]]).optional().nullable(),
})

/**
 * Create a WorkCommsProduct (replaces WorkOutput)
 * Automatically creates CompanyWorkLink if CompanyX ID provided
 */
export async function createWorkOutput(data: z.infer<typeof workProductSchema>) {
  try {
    const validated = workProductSchema.parse(data)
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit' }
    }

    // Determine product type
    let productType: WorkCommsProductType = validated.type
    
    // If legacy outputType provided, map it
    if (validated.legacyOutputType && !validated.type) {
      productType = OUTPUT_TYPE_MAP[validated.legacyOutputType] || 'poster'
    }

    // Verify at least one CompanyX ID is provided
    const companyXIds = {
      companyEventId: validated.companyEventId,
      companyCampaignId: validated.companyCampaignId,
      companyTrainingId: validated.companyTrainingId,
      companyBenefitsId: validated.companyBenefitsId,
      companyImpactEventId: validated.companyImpactEventId,
      companyCommunityId: validated.companyCommunityId,
      companyCareerId: validated.companyCareerId,
      companyEmployeeCauseId: validated.companyEmployeeCauseId,
    }

    const hasCompanyXLink = Object.values(companyXIds).some(id => id !== null && id !== undefined)

    if (!hasCompanyXLink) {
      return { success: false, error: 'At least one CompanyX ID (companyEventId, companyCampaignId, etc.) is required' }
    }

    // Create WorkCommsProduct
    const product = await prisma.workCommsProduct.create({
      data: {
        type: productType,
        data: validated.data ?? undefined,
        metadata: validated.metadata ?? undefined,
        companyUnit: companyUnit,
        companyDivision: companyDivision,
        createdByWorkMeId: workMeId,
      },
    })

    // Create CompanyWorkLink for each provided CompanyX ID
    const links = []
    for (const [key, value] of Object.entries(companyXIds)) {
      if (value) {
        const link = await prisma.companyWorkLink.create({
          data: {
            [key]: value,
            workCommsProductId: product.id,
            companyUnit: companyUnit,
            companyDivision: companyDivision,
          },
        })
        links.push(link)
      }
    }

    return { 
      success: true, 
      workOutput: {
        // Return in legacy format for backward compatibility
        id: product.id,
        outputType: validated.legacyOutputType || productType,
        dataJson: product.data,
        status: 'draft',
        createdAt: product.createdAt,
        updatedAt: product.createdAt,
        links,
      },
      product, // Also return new format
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error creating WorkCommsProduct:', error)
    return { success: false, error: 'Failed to create work product' }
  }
}

/**
 * Update a WorkCommsProduct
 */
export async function updateWorkOutput(id: string, data: { data?: any; metadata?: any; dataJson?: any }) {
  try {
    const validated = workProductSchema.pick({ data: true, metadata: true }).partial().parse(data)
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit' }
    }

    const existing = await prisma.workCommsProduct.findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant: ensure same company unit
        createdByWorkMeId: workMeId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Work product not found' }
    }

    const updateData: any = {}
    // Support both 'data' and legacy 'dataJson' for backward compatibility
    if (data.data !== undefined) updateData.data = data.data ?? undefined
    if (data.dataJson !== undefined) updateData.data = data.dataJson ?? undefined
    if (data.metadata !== undefined) updateData.metadata = data.metadata ?? undefined

    const product = await prisma.workCommsProduct.update({
      where: { id },
      data: updateData,
      include: {
        links: true,
      },
    })

    return { 
      success: true, 
      workOutput: {
        id: product.id,
        outputType: product.type,
        dataJson: product.data,
        status: 'draft',
        createdAt: product.createdAt,
        updatedAt: product.createdAt,
      },
      product,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    console.error('Error updating WorkCommsProduct:', error)
    return { success: false, error: 'Failed to update work product' }
  }
}

/**
 * Delete a WorkCommsProduct
 * CompanyWorkLinks are cascade deleted automatically
 */
export async function deleteWorkOutput(id: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit' }
    }

    const existing = await prisma.workCommsProduct.findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant: ensure same company unit
        createdByWorkMeId: workMeId,
      },
    })

    if (!existing) {
      return { success: false, error: 'Work product not found' }
    }

    await prisma.workCommsProduct.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete work product' }
  }
}

/**
 * Get all WorkCommsProducts for the current user
 */
export async function getWorkOutputs(workMeId?: string) {
  try {
    let userId = await getWorkMeId()
    
    if (!userId && workMeId) {
      const workMe = await prisma.workMe.findUnique({
        where: { id: workMeId },
        select: { id: true, companyUnit: true },
      })
      if (workMe) {
        userId = workMeId
      }
    }

    let companyUnit: string | null = null
    if (!userId) {
      try {
        const { firebaseId } = await verifyAuth()
        const workMe = await loadWorkMe(firebaseId)
        userId = workMe.id
        companyUnit = workMe.companyUnit
      } catch (authError) {
        // verifyAuth failed
      }
    }

    if (!userId) {
      return { success: false, error: 'Not authenticated', workOutputs: [] }
    }

    if (!companyUnit) {
      const workMeRecord = await prisma.workMe.findUnique({
        where: { id: userId },
        select: { companyUnit: true },
      })
      companyUnit = workMeRecord?.companyUnit || null
    }

    if (!companyUnit) {
      return { success: false, error: 'User must set a companyUnit', workOutputs: [] }
    }

    const products = await prisma.workCommsProduct.findMany({
      where: { 
        companyUnit, // Multi-tenant: filter by company unit
      },
      include: {
        links: {
          include: {
            companyEvent: true,
            companyCampaign: true,
            companyTraining: true,
            companyBenefits: true,
            companyImpactEvent: true,
            companyCommunity: true,
            companyCareer: true,
            companyEmployeeCause: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to legacy format for backward compatibility
    const workOutputs = products.map(product => ({
      id: product.id,
      outputType: product.type,
      dataJson: product.data,
      status: 'draft',
      createdAt: product.createdAt,
      updatedAt: product.createdAt,
      links: product.links,
    }))

    return { success: true, workOutputs, products }
  } catch (error) {
    console.error('[getWorkOutputs] Error:', error)
    return { success: false, error: 'Failed to fetch work products', workOutputs: [] }
  }
}

/**
 * Get a single WorkCommsProduct by ID
 */
export async function getWorkOutput(id: string) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit' }
    }

    const product = await prisma.workCommsProduct.findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant: ensure same company unit
      },
      include: {
        links: {
          include: {
            companyEvent: true,
            companyCampaign: true,
            companyTraining: true,
            companyBenefits: true,
            companyImpactEvent: true,
            companyCommunity: true,
            companyCareer: true,
            companyEmployeeCause: true,
          },
        },
      },
    })

    if (!product) {
      return { success: false, error: 'Work product not found' }
    }

    return { 
      success: true, 
      workOutput: {
        id: product.id,
        outputType: product.type,
        dataJson: product.data,
        status: 'draft',
        createdAt: product.createdAt,
        updatedAt: product.createdAt,
        links: product.links,
      },
      product,
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work product' }
  }
}

/**
 * Get WorkCommsProducts linked to a CompanyX model via CompanyWorkLink
 * Replaces getWorkOutputsByRouter
 */
export async function getWorkOutputsByRouter(companyXId: string, companyXType: 'event' | 'campaign' | 'training' | 'benefits' | 'impact_event' | 'community' | 'career' | 'employee_cause') {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or user must set a companyUnit', workOutputs: [] }
    }

    // Build where clause based on type
    const whereClause: any = {
      companyUnit,
      companyDivision: companyDivision || undefined,
    }

    switch (companyXType) {
      case 'event':
        whereClause.companyEventId = companyXId
        break
      case 'campaign':
        whereClause.companyCampaignId = companyXId
        break
      case 'training':
        whereClause.companyTrainingId = companyXId
        break
      case 'benefits':
        whereClause.companyBenefitsId = companyXId
        break
      case 'impact_event':
        whereClause.companyImpactEventId = companyXId
        break
      case 'community':
        whereClause.companyCommunityId = companyXId
        break
      case 'career':
        whereClause.companyCareerId = companyXId
        break
      case 'employee_cause':
        whereClause.companyEmployeeCauseId = companyXId
        break
    }

    const links = await prisma.companyWorkLink.findMany({
      where: whereClause,
      include: {
        workCommsProduct: {
          include: {
            links: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const workOutputs = links.map(link => ({
      id: link.workCommsProduct.id,
      outputType: link.workCommsProduct.type,
      dataJson: link.workCommsProduct.data,
      status: 'draft',
      createdAt: link.workCommsProduct.createdAt,
      updatedAt: link.workCommsProduct.createdAt,
      links: [link],
    }))

    return { success: true, workOutputs }
  } catch (error) {
    return { success: false, error: 'Failed to fetch work products', workOutputs: [] }
  }
}

// Legacy alias for backward compatibility
export const getWorkOutputsByContext = getWorkOutputsByRouter
