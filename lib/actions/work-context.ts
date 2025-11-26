'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'
import { getTypedContext } from './typed-contexts'
import type { ContextType } from '@prisma/client'

// Helper to get typed context data from CompanyX models
async function enrichCompanyX(companyX: any, type: ContextType) {
  if (!companyX) return null

  const typedResult = await getTypedContext(type, companyX.id)

  return {
    ...companyX,
    type,
    typedData: typedResult.success ? typedResult.data : null,
    title: typedResult.success ? typedResult.title : companyX.title || 'Unknown',
  }
}

export async function deleteWorkContext(id: string, type: ContextType) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get companyId for multi-tenant security
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: { companyId: true },
    })

    if (!workMe?.companyId) {
      return { success: false, error: 'User must belong to a company' }
    }

    // Delete CompanyX model directly based on type
    const modelMap: Record<ContextType, string> = {
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
      return { success: false, error: 'Invalid context type' }
    }

    await (prisma as any)[modelName].delete({
      where: { 
        id,
        companyId: workMe.companyId,
        originatorId: workMeId,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[deleteWorkContext] Error:', error)
    return { success: false, error: 'Failed to delete work context' }
  }
}

export async function getWorkContexts() {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated', workContexts: [] }
    }

    // Get companyId for multi-tenant security
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: { companyId: true },
    })

    if (!workMe?.companyId) {
      return { success: false, error: 'User must belong to a company', workContexts: [] }
    }

    // Fetch all CompanyX models for this user
    const [campaigns, impactEvents, trainings, events, communities, benefits, careers, employeeCauses] = await Promise.all([
      prisma.companyCampaign.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyImpactEvent.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyTraining.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEvent.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCommunity.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyBenefits.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyCareer.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.companyEmployeeCause.findMany({
        where: { originatorId: workMeId, companyId: workMe.companyId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Combine and enrich all contexts
    const allContexts = [
      ...campaigns.map(c => ({ ...c, type: 'campaign' as ContextType })),
      ...impactEvents.map(e => ({ ...e, type: 'impact_event' as ContextType })),
      ...trainings.map(t => ({ ...t, type: 'training' as ContextType })),
      ...events.map(e => ({ ...e, type: 'event' as ContextType })),
      ...communities.map(c => ({ ...c, type: 'community' as ContextType })),
      ...benefits.map(b => ({ ...b, type: 'benefits' as ContextType })),
      ...careers.map(c => ({ ...c, type: 'career' as ContextType })),
      ...employeeCauses.map(e => ({ ...e, type: 'employee_cause' as ContextType })),
    ]

    // Sort by createdAt descending
    allContexts.sort((a, b) => {
      const aDate = a.createdAt?.getTime() || 0
      const bDate = b.createdAt?.getTime() || 0
      return bDate - aDate
    })

    // Enrich with typed context data (already have the data, just format it)
    const enrichedContexts = allContexts.map(ctx => ({
      ...ctx,
      typedData: ctx,
      title: ctx.title || 'Unknown',
    }))

    return { success: true, workContexts: enrichedContexts }
  } catch (error) {
    console.error('[getWorkContexts] Error:', error)
    return { success: false, error: 'Failed to fetch work contexts', workContexts: [] }
  }
}

export async function getWorkContext(id: string, type: ContextType, clientWorkMeId?: string | null) {
  try {
    let workMeId = await getWorkMeId()

    // Fallback to client-provided workMeId if server can't get it
    if (!workMeId && clientWorkMeId) {
      // Verify the workMeId exists in the database for security
      const workMe = await prisma.workMe.findUnique({
        where: { id: clientWorkMeId },
        select: { id: true },
      })
      if (workMe) {
        workMeId = clientWorkMeId
      }
    }

    if (!workMeId) {
      console.error('[getWorkContext] No workMeId found. Client provided:', clientWorkMeId)
      return { success: false, error: 'Not authenticated', workContext: null }
    }

    // Get companyId from workMe
    const workMe = await prisma.workMe.findUnique({
      where: { id: workMeId },
      select: { companyId: true },
    })

    if (!workMe?.companyId) {
      return { success: false, error: 'User must belong to a company', workContext: null }
    }

    // Map type to model name
    const modelMap: Record<ContextType, string> = {
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
      return { success: false, error: 'Invalid context type', workContext: null }
    }

    // Find CompanyX model directly
    const companyX = await (prisma as any)[modelName].findFirst({
      where: { 
        id,
        companyId: workMe.companyId, // Multi-tenant security
        originatorId: workMeId, // Ensure ownership
      },
    })

    if (!companyX) {
      console.error('[getWorkContext] Context not found. ID:', id, 'Type:', type)
      return { success: false, error: 'Work context not found', workContext: null }
    }

    // Enrich with typed context data
    const enriched = await enrichCompanyX(companyX, type)

    return { success: true, workContext: enriched }
  } catch (error) {
    console.error('[getWorkContext] Error:', error)
    return { success: false, error: 'Failed to fetch work context: ' + (error instanceof Error ? error.message : 'Unknown error') }
  }
}

