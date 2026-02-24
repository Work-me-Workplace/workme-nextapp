/**
 * CompanyX Save Handlers Service
 * 
 * Modular save handlers for each CompanyX type.
 * Each handler is responsible for updating its specific model type.
 * 
 * Pattern: Each type has its own handler function that takes parsed data
 * and updates the appropriate Prisma model.
 */

import { PrismaClient } from '@prisma/client'
import type { ContextType } from '@/lib/types/context-type'
import type { ParsedCompanyXData } from './companyx-unified-mapper'

export interface SaveHandlerContext {
  prisma: PrismaClient
  ingestResult: {
    id: string
    type: ContextType
    modelName: string
  }
  parsedData: ParsedCompanyXData
}

export interface SaveHandlerResult {
  id: string
  type: ContextType
  record: any
}

/**
 * Save handler for Training type
 */
export async function saveTraining(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'training' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for training type')
  }

  const pocName = data.poc?.name || ''
  const nameParts = pocName.split(' ')
  const pocFirstName = nameParts[0] || null
  const pocLastName = nameParts.slice(1).join(' ') || null

  const updatedRecord = await prisma.companyTraining.update({
    where: { id: ingestResult.id },
    data: {
      title: data.title || 'Untitled Training',
      description: data.description,
      topic: data.topic,
      mandatory: data.mandatory ?? false,
      sponsoringOffice: data.sponsoringOffice,
      trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      format: data.format,
      link: data.link,
      pocFirstName,
      pocLastName,
      pocEmail: data.poc?.email,
      pocPhone: data.poc?.phone,
      pocRankOrTitle: data.poc?.rankOrTitle,
      ingestStatus: 'saved',
      summary: data.description || data.title || null,
    },
  })

  return {
    id: updatedRecord.id,
    type: 'training',
    record: updatedRecord,
  }
}

/**
 * Save handler for Career type
 */
export async function saveCareer(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'career' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for career type')
  }

  // Filter out any skills-related leakage
  const { skillsRaw, strengthsRaw, specialties, certifications, workSkills, mySkills, ...cleanData } = data as any

  const updatedRecord = await prisma.companyCareer.update({
    where: { id: ingestResult.id },
    data: {
      title: cleanData.title || 'Untitled Career Opportunity',
      description: cleanData.description,
      level: cleanData.level,
      type: cleanData.type,
      eligibility: cleanData.eligibility ? {
        paygradeRange: cleanData.eligibility.paygradeRange,
        timeInServiceMonths: cleanData.eligibility.timeInServiceMonths,
        timeInPositionMonths: cleanData.eligibility.timeInPositionMonths,
        who: cleanData.eligibility.who,
      } : undefined,
      application: cleanData.application ? {
        instructions: cleanData.application.instructions,
        link: cleanData.application.link,
      } : undefined,
      extras: cleanData.extras ? {
        cost: cleanData.extras.cost,
        notes: cleanData.extras.notes,
      } : undefined,
      summary: cleanData.description || cleanData.title || null,
    },
  })

  return {
    id: updatedRecord.id,
    type: 'career',
    record: updatedRecord,
  }
}

/**
 * Save handler for Event type
 */
export async function saveEvent(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'event' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for event type')
  }

  const updatedRecord = await prisma.companyEvent.update({
    where: { id: ingestResult.id },
    data: {
      title: data.title || 'Untitled Event',
      theme: data.theme,
      description: data.description,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      eventCategory: data.eventCategory,
      registrationRequired: data.registrationRequired,
      registrationLink: data.registrationLink,
      audience: data.audience,
      vibe: data.vibe,
      eventItems: data.eventItems || [],
      participation: data.participation || [],
      foodProvided: data.foodProvided,
      foodTypes: data.foodTypes,
      speakers: data.speakers || [],
      intendedEffect: data.intendedEffect ?? undefined,
      pocEmail: data.pocEmail,
      pocPhone: data.pocPhone,
      summary: data.description || data.theme || data.title || null,
    },
  })

  return {
    id: updatedRecord.id,
    type: 'event',
    record: updatedRecord,
  }
}

/**
 * Save handler for Leader Engagement type
 */
export async function saveLeaderEngagement(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'leader_engagement' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for leader_engagement type')
  }

  const updatedRecord = await prisma.companyLeaderEngagement.update({
    where: { id: ingestResult.id },
    data: {
      title: data.title || 'Untitled Leader Engagement',
      description: data.description,
      engagementDate: data.engagementDate ? new Date(data.engagementDate) : null,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      topicAreas: data.topicAreas || [],
      potentialQuestions: data.potentialQuestions || [],
      keyMessages: data.keyMessages || [],
      talkingPoints: data.talkingPoints,
      leaderName: data.leaderName,
      leaderTitle: data.leaderTitle,
      leaderId: data.leaderId,
      audience: data.audience,
      registrationRequired: data.registrationRequired,
      registrationLink: data.registrationLink,
      format: data.format,
      qAndAEnabled: data.qAndAEnabled ?? false,
      pocEmail: data.pocEmail,
      pocPhone: data.pocPhone,
      summary: data.description || data.title || null,
    },
  })

  return {
    id: updatedRecord.id,
    type: 'leader_engagement',
    record: updatedRecord,
  }
}

/**
 * Save handler for Campaign type
 */
export async function saveCampaign(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'campaign' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for campaign type')
  }

  const updatedRecord = await prisma.companyCampaign.update({
    where: { id: ingestResult.id },
    data: {
      title: data.title || 'Untitled Campaign',
      description: data.description,
      windowStart: data.windowStart ? new Date(data.windowStart) : null,
      windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
      ctaLink: data.ctaLink,
      sponsor: data.sponsor,
      pocFirstName: data.pocFirstName,
      pocLastName: data.pocLastName,
      pocEmail: data.pocEmail,
      pocPhone: data.pocPhone,
      summary: data.description || data.title || null,
    },
  })

  return {
    id: updatedRecord.id,
    type: 'campaign',
    record: updatedRecord,
  }
}

/**
 * Save handler for Impact Event type
 */
export async function saveImpactEvent(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'impact_event' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for impact_event type')
  }

  const updatedRecord = await prisma.companyImpactEvent.update({
    where: { id: ingestResult.id },
    data: {
      // Full model matching schema
      title: data.title || 'Untitled Impact Event',
      description: data.description,
      summary: data.summary || data.description || null,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
      location: data.location,
      impactedPopulation: data.impactedPopulation,
      urgency: data.urgency,
      pocFirstName: data.pocFirstName,
      pocLastName: data.pocLastName,
      pocEmail: data.pocEmail,
      pocPhone: data.pocPhone,
    },
  })

  return {
    id: updatedRecord.id,
    type: 'impact_event',
    record: updatedRecord,
  }
}

/**
 * Save handler for Community type
 */
export async function saveCommunity(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'community' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for community type')
  }

  const updatedRecord = await prisma.companyCommunity.update({
    where: { id: ingestResult.id },
    data: {
      title: data.title || 'Untitled Community Opportunity',
      description: data.description,
      partnerOrg: data.partnerOrg,
      date: data.date ? new Date(data.date) : null,
      location: data.location,
      signUpLink: data.signUpLink,
      pocFirstName: data.pocFirstName,
      pocLastName: data.pocLastName,
      pocEmail: data.pocEmail,
      pocPhone: data.pocPhone,
      summary: data.description || data.title || null,
    },
  })

  return {
    id: updatedRecord.id,
    type: 'community',
    record: updatedRecord,
  }
}

/**
 * Save handler for Benefits type
 */
export async function saveBenefits(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'benefits' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for benefits type')
  }

  const updateData: any = {
    title: data.title || 'Untitled Benefits',
    description: data.description,
    employeeBenefitSummary: data.employeeBenefitSummary,
    windowStart: data.windowStart ? new Date(data.windowStart) : null,
    windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
    actionLink: data.actionLink,
    summary: data.description || data.employeeBenefitSummary || data.title || null,
  }
  if (data.deadlines != null) updateData.deadlines = data.deadlines
  if (data.resources != null) updateData.resources = data.resources
  if (data.pocList != null) updateData.pocList = data.pocList

  const updatedRecord = await prisma.companyBenefits.update({
    where: { id: ingestResult.id },
    data: updateData,
  })

  return {
    id: updatedRecord.id,
    type: 'benefits',
    record: updatedRecord,
  }
}

/**
 * Save handler for Employee Cause type
 */
export async function saveEmployeeCause(context: SaveHandlerContext): Promise<SaveHandlerResult> {
  const { prisma, ingestResult, parsedData } = context
  const data = parsedData.type === 'employee_cause' ? parsedData.data : null

  if (!data) {
    throw new Error('Invalid parsed data for employee_cause type')
  }

  const updateData: any = {
    title: data.title || 'Untitled Employee Cause',
    description: data.description,
    impactSummary: data.impactSummary,
    partnerOrg: data.partnerOrg,
    windowStart: data.windowStart ? new Date(data.windowStart) : null,
    windowEnd: data.windowEnd ? new Date(data.windowEnd) : null,
    locations: data.locations || [],
    link: data.link,
    sponsoringDepartment: data.sponsoringDepartment,
    summary: data.description || data.impactSummary || data.title || null,
  }
  if (data.deadlines != null) updateData.deadlines = data.deadlines
  if (data.pocList != null) updateData.pocList = data.pocList
  if (data.extraInstructions != null) updateData.extraInstructions = data.extraInstructions

  const updatedRecord = await prisma.companyEmployeeCause.update({
    where: { id: ingestResult.id },
    data: updateData,
  })

  return {
    id: updatedRecord.id,
    type: 'employee_cause',
    record: updatedRecord,
  }
}

/**
 * Router function that delegates to the appropriate save handler
 */
export async function saveCompanyX(
  prisma: PrismaClient,
  ingestResult: { id: string; type: ContextType; modelName: string },
  parsedData: ParsedCompanyXData
): Promise<SaveHandlerResult> {
  const context: SaveHandlerContext = {
    prisma,
    ingestResult,
    parsedData,
  }

  switch (parsedData.type) {
    case 'training':
      return saveTraining(context)
    case 'career':
      return saveCareer(context)
    case 'event':
      return saveEvent(context)
    case 'leader_engagement':
      return saveLeaderEngagement(context)
    case 'campaign':
      return saveCampaign(context)
    case 'impact_event':
      return saveImpactEvent(context)
    case 'community':
      return saveCommunity(context)
    case 'benefits':
      return saveBenefits(context)
    case 'employee_cause':
      return saveEmployeeCause(context)
    default:
      throw new Error(`Unsupported CompanyX type: ${(parsedData as any).type}`)
  }
}

