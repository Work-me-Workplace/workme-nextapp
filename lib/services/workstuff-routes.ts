/**
 * WorkStuff Route Mapper
 * 
 * Maps route segments to CompanyX types and models
 */

import type { ContextType } from '@/lib/types/context-type'
import { CONTEXT_TYPE_TO_MODEL } from './companyx-mapper'

/**
 * Map route segment to ContextType
 */
export const ROUTE_TO_TYPE: Record<string, ContextType> = {
  'training': 'training',
  'career': 'career',
  'events': 'event',
  'event': 'event',
  'campaign': 'campaign',
  'impact-event': 'impact_event',
  'community': 'community',
  'benefits': 'benefits',
  'cause': 'employee_cause',
  'employee-cause': 'employee_cause',
}

/**
 * Map ContextType to route segment
 */
export const TYPE_TO_ROUTE: Record<ContextType, string> = {
  training: 'training',
  career: 'career',
  event: 'events',
  campaign: 'campaign',
  impact_event: 'impact-event',
  community: 'community',
  benefits: 'benefits',
  employee_cause: 'cause',
}

/**
 * Get ContextType from route segment
 */
export function getTypeFromRoute(routeSegment: string): ContextType | null {
  return ROUTE_TO_TYPE[routeSegment] || null
}

/**
 * Get model name from route segment
 */
export function getModelFromRoute(routeSegment: string): string | null {
  const type = getTypeFromRoute(routeSegment)
  if (!type) return null
  return CONTEXT_TYPE_TO_MODEL[type]
}
