'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { eventSchema, campaignSchema, impactEventSchema, trainingSchema, communityOpportunitySchema, benefitsSchema, careerSchema, employeeCauseSchema } from '@/lib/server/context-schemas'

// Note: All schemas are now imported from context-schemas.ts
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  windowStart: z.date().optional().nullable(),
  windowEnd: z.date().optional().nullable(),
  ctaLink: z.string().url().optional().nullable(),
  sponsor: z.string().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Impact Event Schema
const impactEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  effectiveDate: z.date().optional().nullable(),
  impactedPopulation: z.string().optional().nullable(),
  urgency: z.string().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Training Schema
const trainingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  trainingDate: z.date().optional().nullable(),
  deadline: z.date().optional().nullable(),
  link: z.string().url().optional().nullable(),
  mandatory: z.boolean().default(false),
  sponsoringOffice: z.string().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Event Schema is imported from context-schemas.ts (with audience enum)

// Community Opportunity Schema
const communityOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  partnerOrg: z.string().optional().nullable(),
  date: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  signUpLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Benefits Schema
const benefitsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  windowStart: z.date().optional().nullable(),
  windowEnd: z.date().optional().nullable(),
  fehbLink: z.string().url().optional().nullable(),
  fedvipLink: z.string().url().optional().nullable(),
  fsafedsLink: z.string().url().optional().nullable(),
  faqLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
  pocDepartment: z.string().optional().nullable(),
  annualRecurrence: z.boolean().default(false),
})

// Career Schema (performance reviews, assessments, etc.)
const careerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  deadlines: z.array(z.object({
    label: z.string(),
    date: z.date(),
  })).optional().nullable(),
  supervisorName: z.string().optional().nullable(),
  resourceLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
  pocDepartment: z.string().optional().nullable(),
})

// Create Campaign
export async function createCampaign(data: z.infer<typeof campaignSchema>, clientWorkMeId?: string | null) {
  try {
    const validated = campaignSchema.parse(data)
    
    // Use verifyAuth to get workMeId and companyId
    const { workMeId, companyId } = await verifyAuth()

    const campaign = await prisma.workContextCampaign.create({
      data: {
        ...validated,
        originatorId: workMeId,
        companyId: companyId,
        description: validated.description ?? undefined,
        windowStart: validated.windowStart ?? undefined,
        windowEnd: validated.windowEnd ?? undefined,
        ctaLink: validated.ctaLink ?? undefined,
        sponsor: validated.sponsor ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    // Create WorkEventRouter router entry
    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'campaign',
        eventRefId: campaign.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, campaign, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create campaign' }
  }
}

// Create Impact Event
export async function createImpactEvent(data: z.infer<typeof impactEventSchema>) {
  try {
    const validated = impactEventSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const impactEvent = await prisma.workContextImpactEvent.create({
      data: {
        ...validated,
        originatorId: workMeId,
        companyId: companyId,
        description: validated.description ?? undefined,
        effectiveDate: validated.effectiveDate ?? undefined,
        impactedPopulation: validated.impactedPopulation ?? undefined,
        urgency: validated.urgency ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'impact_event',
        eventRefId: impactEvent.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, impactEvent, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create impact event' }
  }
}

// Create Training
export async function createTraining(data: z.infer<typeof trainingSchema>) {
  try {
    const validated = trainingSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const training = await prisma.workContextTraining.create({
      data: {
        ...validated,
        originatorId: workMeId,
        companyId: companyId,
        description: validated.description ?? undefined,
        trainingDate: validated.trainingDate ?? undefined,
        deadline: validated.deadline ?? undefined,
        link: validated.link ?? undefined,
        mandatory: validated.mandatory ?? false,
        sponsoringOffice: validated.sponsoringOffice ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'training',
        eventRefId: training.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, training, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create training' }
  }
}

// Create WorkEvent
export async function createWorkEvent(data: z.infer<typeof eventSchema>) {
  try {
    const validated = eventSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const event = await prisma.workEvent.create({
      data: {
        title: validated.title,
        theme: (validated as any).theme ?? undefined,
        description: validated.description ?? undefined,
        eventDate: validated.eventDate ?? undefined,
        startTime: validated.startTime ?? undefined,
        endTime: validated.endTime ?? undefined,
        eventCategory: validated.eventCategory ?? undefined,
        registrationRequired: validated.registrationRequired ?? undefined,
        registrationLink: validated.registrationLink ?? undefined,
        speakers: validated.speakers ?? [],
        foodProvided: validated.foodProvided ?? undefined,
        foodTypes: validated.foodTypes ?? undefined,
        audience: (validated as any).audience ?? undefined,
        vibe: (validated as any).vibe ?? undefined,
        perks: (validated as any).perks ?? [],
        participation: (validated as any).participation ?? [],
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'event',
        eventRefId: event.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, event, workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create event' }
  }
}

// Legacy alias for backward compatibility
export const createEvent = createWorkEvent

// Create Community Opportunity
export async function createCommunityOpportunity(data: z.infer<typeof communityOpportunitySchema>) {
  try {
    const validated = communityOpportunitySchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const opportunity = await prisma.workContextCommunity.create({
      data: {
        ...validated,
        originatorId: workMeId,
        companyId: companyId,
        description: validated.description ?? undefined,
        date: validated.date ?? undefined,
        location: validated.location ?? undefined,
        signUpLink: validated.signUpLink ?? undefined,
        partnerOrg: validated.partnerOrg ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'community',
        eventRefId: opportunity.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, opportunity, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create community opportunity' }
  }
}

// Employee Cause Schema
const employeeCauseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  partnerOrg: z.string().optional().nullable(),
  windowStart: z.date().optional().nullable(),
  windowEnd: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  neededItems: z.array(z.string()).default([]),
  collectionPoints: z.array(z.string()).default([]),
  signUpLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
  sponsoringDepartment: z.string().optional().nullable(),
})

// Create Career
export async function createCareer(data: z.infer<typeof careerSchema>) {
  try {
    const validated = careerSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const career = await prisma.workContextCareer.create({
      data: {
        title: validated.title,
        description: validated.description ?? undefined,
        deadlines: validated.deadlines ? validated.deadlines : undefined,
        supervisorName: validated.supervisorName ?? undefined,
        resourceLink: validated.resourceLink ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        pocDepartment: validated.pocDepartment ?? undefined,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'career',
        eventRefId: career.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, career, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create career context' }
  }
}

// Create Benefits
export async function createBenefits(data: z.infer<typeof benefitsSchema>) {
  try {
    const validated = benefitsSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const benefits = await prisma.workContextBenefits.create({
      data: {
        ...validated,
        originatorId: workMeId,
        companyId: companyId,
        description: validated.description ?? undefined,
        windowStart: validated.windowStart ?? undefined,
        windowEnd: validated.windowEnd ?? undefined,
        fehbLink: validated.fehbLink ?? undefined,
        fedvipLink: validated.fedvipLink ?? undefined,
        fsafedsLink: validated.fsafedsLink ?? undefined,
        faqLink: validated.faqLink ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        pocDepartment: validated.pocDepartment ?? undefined,
        annualRecurrence: validated.annualRecurrence ?? false,
      },
    })

    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'benefits',
        eventRefId: benefits.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, benefits, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create benefits context' }
  }
}

// Create Employee Cause
export async function createEmployeeCause(data: z.infer<typeof employeeCauseSchema>) {
  try {
    const validated = employeeCauseSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const employeeCause = await prisma.workContextEmployeeCause.create({
      data: {
        title: validated.title,
        description: validated.description ?? undefined,
        partnerOrg: validated.partnerOrg ?? undefined,
        windowStart: validated.windowStart ?? undefined,
        windowEnd: validated.windowEnd ?? undefined,
        location: validated.location ?? undefined,
        neededItems: validated.neededItems || [],
        collectionPoints: validated.collectionPoints || [],
        signUpLink: validated.signUpLink ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        sponsoringDepartment: validated.sponsoringDepartment ?? undefined,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    const workEventRouter = await prisma.workEventRouter.create({
      data: {
        type: 'employee_cause',
        eventRefId: employeeCause.id,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, employeeCause, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Not authenticated' }
    }
    return { success: false, error: 'Failed to create employee cause context' }
  }
}

// Update Campaign
export async function updateCampaign(workContextId: string, data: z.infer<typeof campaignSchema>) {
  try {
    const validated = campaignSchema.parse(data)
    const { workMeId } = await verifyAuth()

    // Get WorkContext to find typeRefId and validate ownership
    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workContextId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'campaign') {
      return { success: false, error: 'Invalid context type or not found' }
    }

    // Update typed model using typeRefId
    const campaign = await prisma.workContextCampaign.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        windowStart: validated.windowStart ?? undefined,
        windowEnd: validated.windowEnd ?? undefined,
        ctaLink: validated.ctaLink ?? undefined,
        sponsor: validated.sponsor ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    return { success: true, campaign, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update campaign' }
  }
}

// Update Impact Event
export async function updateImpactEvent(workContextId: string, data: z.infer<typeof impactEventSchema>) {
  try {
    const validated = impactEventSchema.parse(data)
    const { workMeId } = await verifyAuth()

    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workContextId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'impact_event') {
      return { success: false, error: 'Invalid context type or not found' }
    }

    const impactEvent = await prisma.workContextImpactEvent.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        effectiveDate: validated.effectiveDate ?? undefined,
        impactedPopulation: validated.impactedPopulation ?? undefined,
        urgency: validated.urgency ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    return { success: true, impactEvent, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update impact event' }
  }
}

// Update Training
export async function updateTraining(workContextId: string, data: z.infer<typeof trainingSchema>) {
  try {
    const validated = trainingSchema.parse(data)
    const { workMeId } = await verifyAuth()

    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workContextId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'training') {
      return { success: false, error: 'Invalid context type or not found' }
    }

    const training = await prisma.workContextTraining.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        trainingDate: validated.trainingDate ?? undefined,
        deadline: validated.deadline ?? undefined,
        link: validated.link ?? undefined,
        mandatory: validated.mandatory ?? false,
        sponsoringOffice: validated.sponsoringOffice ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    return { success: true, training, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update training' }
  }
}

// Update WorkEvent
export async function updateWorkEvent(workEventRouterId: string, data: z.infer<typeof eventSchema>) {
  try {
    const validated = eventSchema.parse(data)
    const { workMeId } = await verifyAuth()

    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workEventRouterId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'event') {
      return { success: false, error: 'Invalid router type or not found' }
    }

    const event = await prisma.workEvent.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        title: validated.title,
        theme: (validated as any).theme ?? undefined,
        description: validated.description ?? undefined,
        eventDate: validated.eventDate ?? undefined,
        startTime: validated.startTime ?? undefined,
        endTime: validated.endTime ?? undefined,
        eventCategory: validated.eventCategory ?? undefined,
        registrationRequired: validated.registrationRequired ?? undefined,
        registrationLink: validated.registrationLink ?? undefined,
        speakers: validated.speakers ?? [],
        foodProvided: validated.foodProvided ?? undefined,
        foodTypes: validated.foodTypes ?? undefined,
        audience: (validated as any).audience ?? undefined,
        vibe: (validated as any).vibe ?? undefined,
        perks: (validated as any).perks ?? [],
        participation: (validated as any).participation ?? [],
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    return { success: true, event, workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update event' }
  }
}

// Legacy alias for backward compatibility
export const updateEvent = updateWorkEvent

// Update Community Opportunity
export async function updateCommunityOpportunity(workContextId: string, data: z.infer<typeof communityOpportunitySchema>) {
  try {
    const validated = communityOpportunitySchema.parse(data)
    const { workMeId } = await verifyAuth()

    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workContextId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'community') {
      return { success: false, error: 'Invalid context type or not found' }
    }

    const opportunity = await prisma.workContextCommunity.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        date: validated.date ?? undefined,
        location: validated.location ?? undefined,
        signUpLink: validated.signUpLink ?? undefined,
        partnerOrg: validated.partnerOrg ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    return { success: true, opportunity, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update community opportunity' }
  }
}

// Update Benefits
export async function updateBenefits(workContextId: string, data: z.infer<typeof benefitsSchema>) {
  try {
    const validated = benefitsSchema.parse(data)
    const { workMeId } = await verifyAuth()

    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workContextId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'benefits') {
      return { success: false, error: 'Invalid context type or not found' }
    }

    const benefits = await prisma.workContextBenefits.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        windowStart: validated.windowStart ?? undefined,
        windowEnd: validated.windowEnd ?? undefined,
        fehbLink: validated.fehbLink ?? undefined,
        fedvipLink: validated.fedvipLink ?? undefined,
        fsafedsLink: validated.fsafedsLink ?? undefined,
        faqLink: validated.faqLink ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        pocDepartment: validated.pocDepartment ?? undefined,
        annualRecurrence: validated.annualRecurrence ?? false,
      },
    })

    return { success: true, benefits, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update benefits' }
  }
}

// Update Career
export async function updateCareer(workContextId: string, data: z.infer<typeof careerSchema>) {
  try {
    const validated = careerSchema.parse(data)
    const { workMeId } = await verifyAuth()

    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workContextId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'career') {
      return { success: false, error: 'Invalid context type or not found' }
    }

    const career = await prisma.workContextCareer.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        title: validated.title,
        description: validated.description ?? undefined,
        deadlines: validated.deadlines ? validated.deadlines : undefined,
        supervisorName: validated.supervisorName ?? undefined,
        resourceLink: validated.resourceLink ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        pocDepartment: validated.pocDepartment ?? undefined,
      },
    })

    return { success: true, career, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update career' }
  }
}

// Update Employee Cause
export async function updateEmployeeCause(workContextId: string, data: z.infer<typeof employeeCauseSchema>) {
  try {
    const validated = employeeCauseSchema.parse(data)
    const { workMeId } = await verifyAuth()

    const workEventRouter = await prisma.workEventRouter.findFirst({
      where: { id: workContextId, originatorId: workMeId },
    })

    if (!workEventRouter || workEventRouter.type !== 'employee_cause') {
      return { success: false, error: 'Invalid context type or not found' }
    }

    const employeeCause = await prisma.workContextEmployeeCause.update({
      where: { id: workEventRouter.eventRefId },
      data: {
        title: validated.title,
        description: validated.description ?? undefined,
        partnerOrg: validated.partnerOrg ?? undefined,
        windowStart: validated.windowStart ?? undefined,
        windowEnd: validated.windowEnd ?? undefined,
        location: validated.location ?? undefined,
        neededItems: validated.neededItems || [],
        collectionPoints: validated.collectionPoints || [],
        signUpLink: validated.signUpLink ?? undefined,
        pocFirstName: validated.pocFirstName ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        sponsoringDepartment: validated.sponsoringDepartment ?? undefined,
      },
    })

    return { success: true, employeeCause, workContext: workEventRouter }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update employee cause' }
  }
}

// Get typed context data by WorkContext
export async function getTypedContext(workContext: { type: string; typeRefId: string }) {
  try {
    switch (workContext.type) {
      case 'campaign':
        const campaign = await prisma.workContextCampaign.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: campaign, title: campaign?.title || '' }
      
      case 'impact_event':
        const impactEvent = await prisma.workContextImpactEvent.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: impactEvent, title: impactEvent?.title || '' }
      
      case 'training':
        const training = await prisma.workContextTraining.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: training, title: training?.title || '' }
      
      case 'event':
        const event = await prisma.workEvent.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: event, title: event?.title || '' }
      
      case 'community':
        const opportunity = await prisma.workContextCommunity.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: opportunity, title: opportunity?.title || '' }
      
      case 'benefits':
        const benefits = await prisma.workContextBenefits.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: benefits, title: benefits?.title || '' }
      
      case 'career':
        const career = await prisma.workContextCareer.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: career, title: career?.title || '' }
      
      case 'employee_cause':
        const employeeCause = await prisma.workContextEmployeeCause.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: employeeCause, title: employeeCause?.title || '' }
      
      default:
        return { success: false, error: 'Unknown context type' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch typed context' }
  }
}

