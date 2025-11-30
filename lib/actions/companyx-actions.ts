'use server'

import { createTypedContext } from '@/lib/server/context-factory'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { campaignSchema, impactEventSchema, trainingSchema, eventSchema, communityOpportunitySchema, benefitsSchema, careerSchema, employeeCauseSchema } from '@/lib/server/context-schemas'
import { z } from 'zod'

/**
 * Server actions for creating CompanyX models
 * These wrap createTypedContext from context-factory
 */

export async function createCampaign(data: z.infer<typeof campaignSchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = campaignSchema.parse(data)
    const result = await createTypedContext('campaign', validated, workMeId, companyUnit, companyDivision)
    return { success: true, campaign: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create campaign' }
  }
}

export async function createImpactEvent(data: z.infer<typeof impactEventSchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = impactEventSchema.parse(data)
    const result = await createTypedContext('impact_event', validated, workMeId, companyUnit, companyDivision)
    return { success: true, impactEvent: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create impact event' }
  }
}

export async function createTraining(data: z.infer<typeof trainingSchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = trainingSchema.parse(data)
    const result = await createTypedContext('training', validated, workMeId, companyUnit, companyDivision)
    return { success: true, training: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create training' }
  }
}

export async function createEvent(data: z.infer<typeof eventSchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = eventSchema.parse(data)
    const result = await createTypedContext('event', validated, workMeId, companyUnit, companyDivision)
    return { success: true, event: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create event' }
  }
}

export async function createCommunityOpportunity(data: z.infer<typeof communityOpportunitySchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = communityOpportunitySchema.parse(data)
    const result = await createTypedContext('community', validated, workMeId, companyUnit, companyDivision)
    return { success: true, community: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create community opportunity' }
  }
}

export async function createBenefits(data: z.infer<typeof benefitsSchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = benefitsSchema.parse(data)
    const result = await createTypedContext('benefits', validated, workMeId, companyUnit, companyDivision)
    return { success: true, benefits: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create benefits' }
  }
}

export async function createCareer(data: z.infer<typeof careerSchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = careerSchema.parse(data)
    const result = await createTypedContext('career', validated, workMeId, companyUnit, companyDivision)
    return { success: true, career: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create career' }
  }
}

export async function createEmployeeCause(data: z.infer<typeof employeeCauseSchema>) {
  try {
    const { workMeId, companyUnit, companyDivision } = await verifyAuth()
    if (!workMeId || !companyUnit) {
      return { success: false, error: 'Not authenticated or companyUnit not set' }
    }

    const validated = employeeCauseSchema.parse(data)
    const result = await createTypedContext('employee_cause', validated, workMeId, companyUnit, companyDivision)
    return { success: true, employeeCause: result.typed }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: error.message || 'Failed to create employee cause' }
  }
}

