/**
 * ContextType - Type definitions for CompanyX model types
 * 
 * NOTE: This is a TypeScript type, not a Prisma enum.
 * Since WorkEventRouter was removed, we no longer need this as a database enum.
 * It's used purely for type safety in TypeScript.
 */

export type ContextType =
  | 'campaign'
  | 'impact_event'
  | 'training'
  | 'event'
  | 'community'
  | 'benefits'
  | 'career'
  | 'employee_cause'

export const CONTEXT_TYPES: ContextType[] = [
  'campaign',
  'impact_event',
  'training',
  'event',
  'community',
  'benefits',
  'career',
  'employee_cause',
]

