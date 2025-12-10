'use server'

import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * Get all CompanyX models for the authenticated user
 * Returns all CompanyX models (campaigns, trainings, events, etc.) scoped by companyUnit
 */
export async function getCompanyXModels() {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth()
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return { 
        success: false as const, 
        error: 'User must set a companyUnit',
        companyXModels: []
      }
    }

    // Get all CompanyX models for user's company unit (multi-tenant scoping)
    const [campaigns, impactEvents, trainings, events, communities, benefits, careers, employeeCauses] = await Promise.all([
      prisma.companyCampaign.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyImpactEvent.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyTraining.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEvent.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCommunity.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyBenefits.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCareer.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEmployeeCause.findMany({
        where: { companyUnit },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Combine all CompanyX models with their types
    const allModels = [
      ...campaigns.map(c => ({ ...c, type: 'campaign' as const })),
      ...impactEvents.map(e => ({ ...e, type: 'impact_event' as const })),
      ...trainings.map(t => ({ ...t, type: 'training' as const })),
      ...events.map(e => ({ ...e, type: 'event' as const })),
      ...communities.map(c => ({ ...c, type: 'community' as const })),
      ...benefits.map(b => ({ ...b, type: 'benefits' as const })),
      ...careers.map(c => ({ ...c, type: 'career' as const })),
      ...employeeCauses.map(e => ({ ...e, type: 'employee_cause' as const })),
    ]

    // Sort by createdAt descending
    allModels.sort((a, b) => {
      const aDate = a.createdAt?.getTime() || 0
      const bDate = b.createdAt?.getTime() || 0
      return bDate - aDate
    })

    return { 
      success: true as const, 
      companyXModels: allModels 
    }
  } catch (error: any) {
    console.error('[getCompanyXModels] Error:', error)
    return { 
      success: false as const, 
      error: error.message || 'Failed to fetch CompanyX models',
      companyXModels: []
    }
  }
}

/**
 * Get a single CompanyX model by ID and type
 */
export async function getCompanyXModel(
  id: string,
  type: 'campaign' | 'impact_event' | 'training' | 'event' | 'community' | 'benefits' | 'career' | 'employee_cause',
  clientWorkMeId?: string | null
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth()
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return { 
        success: false as const, 
        error: 'User must set a companyUnit',
        companyXModel: null
      }
    }

    // Map type to model name
    const modelMap: Record<typeof type, string> = {
      campaign: 'companyCampaign',
      impact_event: 'companyImpactEvent',
      training: 'companyTraining',
      event: 'companyEvent',
      community: 'companyCommunity',
      benefits: 'companyBenefits',
      career: 'companyCareer',
      employee_cause: 'companyEmployeeCause',
    }

    const modelName = modelMap[type]
    if (!modelName) {
      return { 
        success: false as const, 
        error: 'Invalid CompanyX type',
        companyXModel: null
      }
    }

    // Find CompanyX model directly
    const companyX = await (prisma as any)[modelName].findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant security
      },
    })

    if (!companyX) {
      return { 
        success: false as const, 
        error: 'CompanyX model not found',
        companyXModel: null
      }
    }

    return { 
      success: true as const, 
      companyXModel: {
        ...companyX,
        type,
      }
    }
  } catch (error: any) {
    console.error('[getCompanyXModel] Error:', error)
    return { 
      success: false as const, 
      error: error.message || 'Failed to fetch CompanyX model',
      companyXModel: null
    }
  }
}

/**
 * Delete a CompanyX model by ID and type
 */
export async function deleteCompanyXModel(
  id: string,
  type: 'campaign' | 'impact_event' | 'training' | 'event' | 'community' | 'benefits' | 'career' | 'employee_cause'
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth()
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit } = workMe

    if (!companyUnit) {
      return { 
        success: false as const, 
        error: 'User must set a companyUnit'
      }
    }

    // Map type to model name
    const modelMap: Record<typeof type, string> = {
      campaign: 'companyCampaign',
      impact_event: 'companyImpactEvent',
      training: 'companyTraining',
      event: 'companyEvent',
      community: 'companyCommunity',
      benefits: 'companyBenefits',
      career: 'companyCareer',
      employee_cause: 'companyEmployeeCause',
    }

    const modelName = modelMap[type]
    if (!modelName) {
      return { 
        success: false as const, 
        error: 'Invalid CompanyX type'
      }
    }

    // Verify it exists and belongs to user's company unit
    const companyX = await (prisma as any)[modelName].findFirst({
      where: { 
        id,
        companyUnit, // Multi-tenant security
      },
    })

    if (!companyX) {
      return { 
        success: false as const, 
        error: 'CompanyX model not found or unauthorized'
      }
    }

    // Delete it
    await (prisma as any)[modelName].delete({
      where: { id },
    })

    return { 
      success: true as const
    }
  } catch (error: any) {
    console.error('[deleteCompanyXModel] Error:', error)
    return { 
      success: false as const, 
      error: error.message || 'Failed to delete CompanyX model'
    }
  }
}

