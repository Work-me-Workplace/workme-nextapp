/**
 * CompanyX Unified Mapper Service
 * 
 * Routes to the appropriate mapper service based on CompanyX type.
 * This is the main entry point for AI-native content mapping.
 */

import type { ContextType } from '@/lib/types/context-type'
import { parseTraining, type TrainingModel } from './training-parser-service'
import { parseCareer, type CareerModel } from './career-parser-service'
import { parseEvent, type EventModel } from './event-mapper-service'
import { parseCampaign, type CampaignModel } from './campaign-mapper-service'
import { parseImpactEvent, type ImpactEventModel } from './impact-event-mapper-service'
import { parseCommunity, type CommunityModel } from './community-mapper-service'
import { parseBenefits, type BenefitsModel } from './benefits-mapper-service'
import { parseEmployeeCause, type EmployeeCauseModel } from './employee-cause-mapper-service'

export type ParsedCompanyXData =
  | { type: 'training'; data: TrainingModel }
  | { type: 'career'; data: CareerModel }
  | { type: 'event'; data: EventModel }
  | { type: 'campaign'; data: CampaignModel }
  | { type: 'impact_event'; data: ImpactEventModel }
  | { type: 'community'; data: CommunityModel }
  | { type: 'benefits'; data: BenefitsModel }
  | { type: 'employee_cause'; data: EmployeeCauseModel }

/**
 * Parse content using the appropriate mapper service for the given type
 * 
 * @param rawText - Raw content text
 * @param type - CompanyX type
 * @returns Parsed data for the specified type
 */
export async function parseCompanyXContent(
  rawText: string,
  type: ContextType
): Promise<ParsedCompanyXData> {
  switch (type) {
    case 'training':
      return { type: 'training', data: await parseTraining(rawText) }
    case 'career':
      return { type: 'career', data: await parseCareer(rawText) }
    case 'event':
      return { type: 'event', data: await parseEvent(rawText) }
    case 'campaign':
      return { type: 'campaign', data: await parseCampaign(rawText) }
    case 'impact_event':
      return { type: 'impact_event', data: await parseImpactEvent(rawText) }
    case 'community':
      return { type: 'community', data: await parseCommunity(rawText) }
    case 'benefits':
      return { type: 'benefits', data: await parseBenefits(rawText) }
    case 'employee_cause':
      return { type: 'employee_cause', data: await parseEmployeeCause(rawText) }
    default:
      throw new Error(`Unknown CompanyX type: ${type}`)
  }
}




