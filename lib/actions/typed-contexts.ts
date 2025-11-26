'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { eventSchema, campaignSchema, impactEventSchema, trainingSchema, communityOpportunitySchema, benefitsSchema, careerSchema, employeeCauseSchema } from '@/lib/server/context-schemas'

// Note: All schemas are now imported from context-schemas.ts
// Local schema definitions removed - using imported schemas

// Campaign Schema (using imported schema)

// All schemas are imported from context-schemas.ts - no local definitions needed

// Create Campaign
export async function createCampaign(data: z.infer<typeof campaignSchema>, clientWorkMeId?: string | null) {
  try {
    const validated = campaignSchema.parse(data)
    
    // Use verifyAuth to get workMeId and companyId
    const { workMeId, companyId } = await verifyAuth()

    const campaign = await prisma.companyCampaign.create({
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

    return { success: true, campaign }
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

    const impactEvent = await prisma.companyImpactEvent.create({
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

    return { success: true, impactEvent }
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

    const training = await prisma.companyTraining.create({
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

    return { success: true, training }
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

    const event = await prisma.companyEvent.create({
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
        audience: validated.audience ?? undefined,
        vibe: validated.vibe ?? undefined,
        perks: validated.perks ?? [],
        participation: validated.participation ?? [],
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
        originatorId: workMeId,
        companyId: companyId,
      },
    })

    return { success: true, event }
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

    const opportunity = await prisma.companyCommunity.create({
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

    return { success: true, opportunity }
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

// Employee Cause Schema is imported from context-schemas.ts

// Create Career
export async function createCareer(data: z.infer<typeof careerSchema>) {
  try {
    const validated = careerSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const career = await prisma.companyCareer.create({
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

    return { success: true, career }
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

    const benefits = await prisma.companyBenefits.create({
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

    return { success: true, benefits }
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

    const employeeCause = await prisma.companyEmployeeCause.create({
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

    return { success: true, employeeCause }
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
export async function updateCampaign(companyCampaignId: string, data: z.infer<typeof campaignSchema>) {
  try {
    const validated = campaignSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    // Update CompanyCampaign directly (validate ownership via companyId and originatorId)
    const campaign = await prisma.companyCampaign.update({
      where: { 
        id: companyCampaignId,
        companyId,
        originatorId: workMeId,
      },
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

    return { success: true, campaign }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update campaign' }
  }
}

// Update Impact Event
export async function updateImpactEvent(companyImpactEventId: string, data: z.infer<typeof impactEventSchema>) {
  try {
    const validated = impactEventSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const impactEvent = await prisma.companyImpactEvent.update({
      where: { 
        id: companyImpactEventId,
        companyId,
        originatorId: workMeId,
      },
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

    return { success: true, impactEvent }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update impact event' }
  }
}

// Update Training
export async function updateTraining(companyTrainingId: string, data: z.infer<typeof trainingSchema>) {
  try {
    const validated = trainingSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const training = await prisma.companyTraining.update({
      where: { 
        id: companyTrainingId,
        companyId,
        originatorId: workMeId,
      },
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

    return { success: true, training }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update training' }
  }
}

// Update CompanyEvent
export async function updateWorkEvent(companyEventId: string, data: z.infer<typeof eventSchema>) {
  try {
    const validated = eventSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const event = await prisma.companyEvent.update({
      where: { 
        id: companyEventId,
        companyId,
        originatorId: workMeId,
      },
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
        audience: validated.audience ?? undefined,
        vibe: validated.vibe ?? undefined,
        perks: validated.perks ?? [],
        participation: validated.participation ?? [],
        pocEmail: validated.pocEmail ?? undefined,
        pocPhone: validated.pocPhone ?? undefined,
      },
    })

    return { success: true, event }
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
export async function updateCommunityOpportunity(companyCommunityId: string, data: z.infer<typeof communityOpportunitySchema>) {
  try {
    const validated = communityOpportunitySchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const opportunity = await prisma.companyCommunity.update({
      where: { 
        id: companyCommunityId,
        companyId,
        originatorId: workMeId,
      },
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

    return { success: true, opportunity }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update community opportunity' }
  }
}

// Update Benefits
export async function updateBenefits(companyBenefitsId: string, data: z.infer<typeof benefitsSchema>) {
  try {
    const validated = benefitsSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const benefits = await prisma.companyBenefits.update({
      where: { 
        id: companyBenefitsId,
        companyId,
        originatorId: workMeId,
      },
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

    return { success: true, benefits }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update benefits' }
  }
}

// Update Career
export async function updateCareer(companyCareerId: string, data: z.infer<typeof careerSchema>) {
  try {
    const validated = careerSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const career = await prisma.companyCareer.update({
      where: { 
        id: companyCareerId,
        companyId,
        originatorId: workMeId,
      },
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

    return { success: true, career }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update career' }
  }
}

// Update Employee Cause
export async function updateEmployeeCause(companyEmployeeCauseId: string, data: z.infer<typeof employeeCauseSchema>) {
  try {
    const validated = employeeCauseSchema.parse(data)
    const { workMeId, companyId } = await verifyAuth()

    const employeeCause = await prisma.companyEmployeeCause.update({
      where: { 
        id: companyEmployeeCauseId,
        companyId,
        originatorId: workMeId,
      },
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

    return { success: true, employeeCause }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update employee cause' }
  }
}

// Get typed context data by CompanyX ID and type
export async function getTypedContext(type: string, companyXId: string) {
  try {
    switch (type) {
      case 'campaign':
        const campaign = await prisma.companyCampaign.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: campaign, title: campaign?.title || '' }
      
      case 'impact_event':
        const impactEvent = await prisma.companyImpactEvent.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: impactEvent, title: impactEvent?.title || '' }
      
      case 'training':
        const training = await prisma.companyTraining.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: training, title: training?.title || '' }
      
      case 'event':
        const event = await prisma.companyEvent.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: event, title: event?.title || '' }
      
      case 'community':
        const opportunity = await prisma.companyCommunity.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: opportunity, title: opportunity?.title || '' }
      
      case 'benefits':
        const benefits = await prisma.companyBenefits.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: benefits, title: benefits?.title || '' }
      
      case 'career':
        const career = await prisma.companyCareer.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: career, title: career?.title || '' }
      
      case 'employee_cause':
        const employeeCause = await prisma.companyEmployeeCause.findUnique({
          where: { id: companyXId },
        })
        return { success: true, data: employeeCause, title: employeeCause?.title || '' }
      
      default:
        return { success: false, error: 'Unknown context type' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch typed context' }
  }
}

