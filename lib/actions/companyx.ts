'use server'

import { verifyAuth } from '@/lib/server/verifyAuth'
import { loadWorkMe } from '@/lib/auth/loadWorkMe'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * Server actions for creating CompanyX models
 * These create CompanyX models directly using Prisma
 */

export async function createCampaign(data: {
  title: string
  description?: string | null
  windowStart?: Date | null
  windowEnd?: Date | null
  ctaLink?: string | null
  sponsor?: string | null
  pocFirstName?: string | null
  pocLastName?: string | null
  pocEmail?: string | null
  pocPhone?: string | null
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const campaign = await prisma.companyCampaign.create({
      data: {
        title: data.title,
        description: data.description || null,
        windowStart: data.windowStart || null,
        windowEnd: data.windowEnd || null,
        ctaLink: data.ctaLink || null,
        sponsor: data.sponsor || null,
        pocFirstName: data.pocFirstName || null,
        pocLastName: data.pocLastName || null,
        pocEmail: data.pocEmail || null,
        pocPhone: data.pocPhone || null,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, campaign }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create campaign' }
  }
}

export async function createImpactEvent(data: {
  title: string
  description?: string | null
  effectiveDate?: Date | null
  impactedPopulation?: string | null
  urgency?: string | null
  pocFirstName?: string | null
  pocLastName?: string | null
  pocEmail?: string | null
  pocPhone?: string | null
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const impactEvent = await prisma.companyImpactEvent.create({
      data: {
        title: data.title,
        description: data.description || null,
        effectiveDate: data.effectiveDate || null,
        impactedPopulation: data.impactedPopulation || null,
        urgency: data.urgency || null,
        pocFirstName: data.pocFirstName || null,
        pocLastName: data.pocLastName || null,
        pocEmail: data.pocEmail || null,
        pocPhone: data.pocPhone || null,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, impactEvent }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create impact event' }
  }
}

export async function createTraining(data: {
  title: string
  description?: string | null
  trainingDate?: Date | null
  deadline?: Date | null
  link?: string | null
  mandatory?: boolean
  sponsoringOffice?: string | null
  pocFirstName?: string | null
  pocLastName?: string | null
  pocEmail?: string | null
  pocPhone?: string | null
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const training = await prisma.companyTraining.create({
      data: {
        title: data.title,
        description: data.description || null,
        trainingDate: data.trainingDate || null,
        link: data.link || null,
        mandatory: data.mandatory || false,
        sponsoringOffice: data.sponsoringOffice || null,
        pocFirstName: data.pocFirstName || null,
        pocLastName: data.pocLastName || null,
        pocEmail: data.pocEmail || null,
        pocPhone: data.pocPhone || null,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, training }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create training' }
  }
}

export async function createEvent(data: {
  title: string
  theme?: string | null
  description?: string | null
  eventDate?: Date | null
  startTime?: string | null
  endTime?: string | null
  eventCategory?: string | null
  registrationRequired?: string | null
  registrationLink?: string | null
  audience?: string | null
  vibe?: string | null
  perks?: string[]
  participation?: string[]
  foodProvided?: string | null
  foodTypes?: string | null
  speakers?: string[]
  pocEmail?: string | null
  pocPhone?: string | null
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const event = await prisma.companyEvent.create({
      data: {
        title: data.title,
        theme: data.theme || null,
        description: data.description || null,
        eventDate: data.eventDate || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        eventCategory: data.eventCategory as any || null,
        registrationRequired: data.registrationRequired || null,
        registrationLink: data.registrationLink || null,
        audience: data.audience as any || null,
        vibe: data.vibe || null,
        perks: data.perks || [],
        participation: data.participation || [],
        foodProvided: data.foodProvided || null,
        foodTypes: data.foodTypes || null,
        speakers: data.speakers || [],
        pocEmail: data.pocEmail || null,
        pocPhone: data.pocPhone || null,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, event }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create event' }
  }
}

export async function createCommunityOpportunity(data: {
  title: string
  description?: string | null
  partnerOrg?: string | null
  date?: Date | null
  location?: string | null
  signUpLink?: string | null
  pocFirstName?: string | null
  pocLastName?: string | null
  pocEmail?: string | null
  pocPhone?: string | null
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const community = await prisma.companyCommunity.create({
      data: {
        title: data.title,
        description: data.description || null,
        partnerOrg: data.partnerOrg || null,
        date: data.date || null,
        location: data.location || null,
        signUpLink: data.signUpLink || null,
        pocFirstName: data.pocFirstName || null,
        pocLastName: data.pocLastName || null,
        pocEmail: data.pocEmail || null,
        pocPhone: data.pocPhone || null,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, community }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create community opportunity' }
  }
}

export async function createBenefits(data: {
  title: string
  description?: string | null
  windowStart?: Date | null
  windowEnd?: Date | null
  fehbLink?: string | null
  fedvipLink?: string | null
  fsafedsLink?: string | null
  faqLink?: string | null
  pocFirstName?: string | null
  pocLastName?: string | null
  pocEmail?: string | null
  pocPhone?: string | null
  pocDepartment?: string | null
  annualRecurrence?: boolean
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const benefits = await prisma.companyBenefits.create({
      data: {
        title: data.title,
        description: data.description || null,
        windowStart: data.windowStart || null,
        windowEnd: data.windowEnd || null,
        actionLink: data.fehbLink || data.fedvipLink || data.fsafedsLink || null,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, benefits }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create benefits' }
  }
}

export async function createCareer(data: {
  title: string
  description?: string | null
  deadlines?: Array<{ label: string; date: Date }> | null
  supervisorName?: string | null
  resourceLink?: string | null
  pocFirstName?: string | null
  pocLastName?: string | null
  pocEmail?: string | null
  pocPhone?: string | null
  pocDepartment?: string | null
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const career = await prisma.companyCareer.create({
      data: {
        title: data.title,
        description: data.description || null,
        ...(data.deadlines ? { eligibility: { deadlines: data.deadlines } } : {}),
        ...(data.resourceLink ? { application: { link: data.resourceLink } } : {}),
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, career }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create career' }
  }
}

export async function createEmployeeCause(data: {
  title: string
  description?: string | null
  partnerOrg?: string | null
  windowStart?: Date | null
  windowEnd?: Date | null
  location?: string | null
  neededItems?: string[]
  collectionPoints?: string[]
  signUpLink?: string | null
  pocFirstName?: string | null
  pocLastName?: string | null
  pocEmail?: string | null
  pocPhone?: string | null
  sponsoringDepartment?: string | null
}) {
  try {
    const { firebaseId } = await verifyAuth()
    const workMe = await loadWorkMe(firebaseId)
    const { id: workMeId, companyId } = workMe

    if (!workMeId || !companyId) {
      return { success: false, error: 'Not authenticated or companyId not set' }
    }

    const employeeCause = await prisma.companyEmployeeCause.create({
      data: {
        title: data.title,
        description: data.description || null,
        partnerOrg: data.partnerOrg || null,
        windowStart: data.windowStart || null,
        windowEnd: data.windowEnd || null,
        locations: data.collectionPoints || [],
        link: data.signUpLink || null,
        pocList: data.pocFirstName || data.pocLastName || data.pocEmail || data.pocPhone
          ? [{
              firstName: data.pocFirstName || null,
              lastName: data.pocLastName || null,
              email: data.pocEmail || null,
              phone: data.pocPhone || null,
            }]
          : undefined,
        sponsoringDepartment: data.sponsoringDepartment || null,
        companyId,
        createdByWorkMeId: workMeId,
      },
    })

    return { success: true, employeeCause }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create employee cause' }
  }
}

