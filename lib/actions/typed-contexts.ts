'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'

// Campaign Schema
const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  windowStart: z.date().optional().nullable(),
  windowEnd: z.date().optional().nullable(),
  ctaLink: z.string().url().optional().nullable(),
  sponsor: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
})

// Impact Event Schema
const impactEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  effectiveDate: z.date().optional().nullable(),
  impactedPopulation: z.string().optional().nullable(),
  urgency: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
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
  pocLastName: z.string().optional().nullable(),
})

// Event Schema
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  eventCategory: z.string().optional().nullable(),
})

// Community Opportunity Schema
const communityOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  partnerOrg: z.string().optional().nullable(),
  date: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  signUpLink: z.string().url().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
})

// Create Campaign
export async function createCampaign(data: z.infer<typeof campaignSchema>) {
  try {
    const validated = campaignSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const campaign = await prisma.workContextCampaign.create({
      data: {
        ...validated,
        createdByWorkMeId: workMeId,
        description: validated.description ?? undefined,
        windowStart: validated.windowStart ?? undefined,
        windowEnd: validated.windowEnd ?? undefined,
        ctaLink: validated.ctaLink ?? undefined,
        sponsor: validated.sponsor ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
      },
    })

    // Create WorkContext router entry
    const workContext = await prisma.workContext.create({
      data: {
        type: 'campaign',
        typeRefId: campaign.id,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, campaign, workContext }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create campaign' }
  }
}

// Create Impact Event
export async function createImpactEvent(data: z.infer<typeof impactEventSchema>) {
  try {
    const validated = impactEventSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const impactEvent = await prisma.workContextImpactEvent.create({
      data: {
        ...validated,
        createdByWorkMeId: workMeId,
        description: validated.description ?? undefined,
        effectiveDate: validated.effectiveDate ?? undefined,
        impactedPopulation: validated.impactedPopulation ?? undefined,
        urgency: validated.urgency ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
      },
    })

    const workContext = await prisma.workContext.create({
      data: {
        type: 'impact_event',
        typeRefId: impactEvent.id,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, impactEvent, workContext }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create impact event' }
  }
}

// Create Training
export async function createTraining(data: z.infer<typeof trainingSchema>) {
  try {
    const validated = trainingSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const training = await prisma.workContextTraining.create({
      data: {
        ...validated,
        createdByWorkMeId: workMeId,
        description: validated.description ?? undefined,
        trainingDate: validated.trainingDate ?? undefined,
        deadline: validated.deadline ?? undefined,
        link: validated.link ?? undefined,
        mandatory: validated.mandatory ?? false,
        sponsoringOffice: validated.sponsoringOffice ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
      },
    })

    const workContext = await prisma.workContext.create({
      data: {
        type: 'training',
        typeRefId: training.id,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, training, workContext }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create training' }
  }
}

// Create Event
export async function createEvent(data: z.infer<typeof eventSchema>) {
  try {
    const validated = eventSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const event = await prisma.workContextEvent.create({
      data: {
        ...validated,
        createdByWorkMeId: workMeId,
        description: validated.description ?? undefined,
        startDate: validated.startDate ?? undefined,
        endDate: validated.endDate ?? undefined,
        location: validated.location ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
        eventCategory: validated.eventCategory ?? undefined,
      },
    })

    const workContext = await prisma.workContext.create({
      data: {
        type: 'event',
        typeRefId: event.id,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, event, workContext }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create event' }
  }
}

// Create Community Opportunity
export async function createCommunityOpportunity(data: z.infer<typeof communityOpportunitySchema>) {
  try {
    const validated = communityOpportunitySchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const opportunity = await prisma.workContextCommunity.create({
      data: {
        ...validated,
        createdByWorkMeId: workMeId,
        description: validated.description ?? undefined,
        date: validated.date ?? undefined,
        location: validated.location ?? undefined,
        signUpLink: validated.signUpLink ?? undefined,
        partnerOrg: validated.partnerOrg ?? undefined,
        pocLastName: validated.pocLastName ?? undefined,
      },
    })

    const workContext = await prisma.workContext.create({
      data: {
        type: 'community',
        typeRefId: opportunity.id,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, opportunity, workContext }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create community opportunity' }
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
        const event = await prisma.workContextEvent.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: event, title: event?.title || '' }
      
      case 'community':
        const opportunity = await prisma.workContextCommunity.findUnique({
          where: { id: workContext.typeRefId },
        })
        return { success: true, data: opportunity, title: opportunity?.title || '' }
      
      default:
        return { success: false, error: 'Unknown context type' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch typed context' }
  }
}

