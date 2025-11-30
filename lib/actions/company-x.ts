'use server'

import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'

/**
 * Get all CompanyX models (contexts) for the authenticated user
 * Replaces getWorkContexts() from deleted work-context.ts
 */
export async function getCompanyXContexts() {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth()
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!companyUnit) {
      return { 
        success: false as const, 
        error: 'User must set a companyUnit',
        workContexts: []
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

    // Combine all contexts with their types
    const allContexts = [
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
    allContexts.sort((a, b) => {
      const aDate = a.createdAt?.getTime() || 0
      const bDate = b.createdAt?.getTime() || 0
      return bDate - aDate
    })

    // Enrich with typed data (already have it, just format)
    const enrichedContexts = allContexts.map(ctx => ({
      ...ctx,
      typedData: ctx,
      title: ctx.title || 'Unknown',
    }))

    return { 
      success: true as const, 
      workContexts: enrichedContexts 
    }
  } catch (error: any) {
    console.error('[getCompanyXContexts] Error:', error)
    return { 
      success: false as const, 
      error: error.message || 'Failed to fetch contexts',
      workContexts: []
    }
  }
}

/**
 * Get a single CompanyX model by ID and type
 * Replaces getWorkContext() from deleted work-context.ts
 */
export async function getCompanyXContext(
  id: string,
  type: 'campaign' | 'impact_event' | 'training' | 'event' | 'community' | 'benefits' | 'career' | 'employee_cause',
  clientWorkMeId?: string | null
) {
  try {
    // 1. Auth
    const { firebaseId } = await verifyAuth()
    
    // 2. Load WorkMe identity
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyUnit, companyDivision } = workMe

    if (!companyUnit) {
      return { 
        success: false as const, 
        error: 'User must set a companyUnit',
        workContext: null
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
        error: 'Invalid context type',
        workContext: null
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
        error: 'Context not found',
        workContext: null
      }
    }

    // Format as workContext
    const workContext = {
      ...companyX,
      type,
      typedData: companyX,
      title: companyX.title || 'Unknown',
    }

    return { 
      success: true as const, 
      workContext 
    }
  } catch (error: any) {
    console.error('[getCompanyXContext] Error:', error)
    return { 
      success: false as const, 
      error: error.message || 'Failed to fetch context',
      workContext: null
    }
  }
}

/**
 * Delete a CompanyX model by ID and type
 * Replaces deleteWorkContext() from deleted work-context.ts
 */
export async function deleteCompanyXContext(
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
        error: 'Invalid context type'
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
        error: 'Context not found or unauthorized'
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
    console.error('[deleteCompanyXContext] Error:', error)
    return { 
      success: false as const, 
      error: error.message || 'Failed to delete context'
    }
  }
}

