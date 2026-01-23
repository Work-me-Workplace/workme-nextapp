/**
 * CompanyX Mapper Service
 * 
 * Maps CompanyX types to Prisma model names and handles CompanyX creation
 * This is the canonical mapping between CompanyX types and database models.
 */

import type { ContextType } from '@/lib/types/context-type'
import { PrismaClient } from '@prisma/client'

/**
 * Map CompanyX type to Prisma model name
 */
export const CONTEXT_TYPE_TO_MODEL: Record<ContextType, string> = {
  campaign: 'companyCampaign',
  impact_event: 'companyImpactEvent',
  training: 'companyTraining',
  event: 'companyEvent',
  leader_engagement: 'companyLeaderEngagement',
  community: 'companyCommunity',
  benefits: 'companyBenefits',
  career: 'companyCareer',
  employee_cause: 'companyEmployeeCause',
}

/**
 * Map CompanyX type to route path segment
 */
export const CONTEXT_TYPE_TO_ROUTE: Record<ContextType, string> = {
  campaign: 'campaign',
  impact_event: 'impact-event',
  training: 'training',
  event: 'event',
  leader_engagement: 'leader-engagement',
  community: 'community',
  benefits: 'benefits',
  career: 'career',
  employee_cause: 'employee-cause',
}

/**
 * Required fields for each CompanyX model during creation
 * These are the minimum fields needed to create a record
 */
export const REQUIRED_FIELDS: Record<ContextType, Record<string, any>> = {
  training: {
    mandatory: false,
  },
  career: {
    title: '', // Required field, will be updated in Stage 2
  },
  campaign: {
    title: '', // Required field, will be updated in Stage 2
  },
  impact_event: {
    title: '', // Required field, will be updated in Stage 2
  },
  event: {
    title: '', // Required field, will be updated in Stage 2
  },
  leader_engagement: {
    title: '', // Required field, will be updated in Stage 2
  },
  community: {
    title: '', // Required field, will be updated in Stage 2
  },
  benefits: {
    title: '', // Required field, will be updated in Stage 2
  },
  employee_cause: {
    title: '', // Required field, will be updated in Stage 2
  },
}

/**
 * Create a CompanyX model with ingest snapshot
 * 
 * @param prisma - Prisma client instance
 * @param type - CompanyX type (campaign, training, event, etc.)
 * @param rawText - Raw ingestion text
 * @param workMeId - WorkMe ID (actor)
 * @param companyId - Company ID (scope)
 * @returns Created CompanyX record
 */
export async function createCompanyXWithIngest(
  prisma: PrismaClient,
  type: ContextType,
  rawText: string,
  workMeId: string,
  companyId: string
) {
  const modelName = CONTEXT_TYPE_TO_MODEL[type]
  const requiredFields = REQUIRED_FIELDS[type]

  // Base data for all CompanyX models
  const baseData: any = {
    ...requiredFields,
    companyId,
    workMeId: workMeId,
  }

  // Add ingest fields - ALL CompanyX models have ingestRawText field
  // This preserves the original raw text for AI generation and reference
  baseData.ingestRawText = rawText
  
  // Training has additional ingest metadata fields
  if (type === 'training') {
    baseData.ingestType = type
    baseData.ingestStatus = 'pending'
    baseData.ingestCreatedAt = new Date()
  }

  // Create the CompanyX model
  const created = await (prisma as any)[modelName].create({
    data: baseData,
  })

  return {
    id: created.id,
    type,
    modelName,
    record: created,
  }
}

/**
 * Get redirect path for a CompanyX model
 */
export function getCompanyXRedirectPath(type: ContextType, id: string): string {
  const routeSegment = CONTEXT_TYPE_TO_ROUTE[type]
  return `/mycompany/workforcestuff/${routeSegment}/ingest/${id}`
}

