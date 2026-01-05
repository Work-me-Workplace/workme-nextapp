/**
 * Company News to Model Parser Service
 * 
 * Universal service that routes CompanyNewsArtifact to appropriate parser
 * based on selected model type.
 */

import { parseCompanyXContent } from './companyx-unified-mapper'
import type { ContextType } from '@/lib/types/context-type'

export type ParseableModelType =
  | 'platform_unit_update'
  | 'platform_unit_statement'
  | 'platform_statement'
  | 'platform_product'
  | 'milestone'
  | 'external_pressure'
  | 'external_env'
  | 'training'
  | 'event'
  | 'career'
  | 'campaign'
  | 'impact_event'
  | 'community'
  | 'benefits'
  | 'employee_cause'

export interface ParseResult {
  modelType: ParseableModelType
  data: any
}

/**
 * Parse CompanyNewsArtifact rawText into the specified model type
 */
export async function parseNewsArtifactToModel(
  rawText: string,
  modelType: ParseableModelType
): Promise<ParseResult> {
  switch (modelType) {
    case 'platform_unit_update':
      // Use the platform unit update parser
      const updateResponse = await fetch('/api/platform/unit/update/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const updateData = await updateResponse.json()
      return {
        modelType: 'platform_unit_update',
        data: updateData.success ? updateData.data : null,
      }

    case 'platform_unit_statement':
      // Use the platform unit statement parser
      const statementResponse = await fetch('/api/platform/unit/statement/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const statementData = await statementResponse.json()
      return {
        modelType: 'platform_unit_statement',
        data: statementData.success ? statementData.data : null,
      }

    case 'platform_statement':
      // Similar to unit statement but for platform product level
      // For now, return basic structure - can enhance later
      return {
        modelType: 'platform_statement',
        data: {
          sourceName: null,
          sourceUrl: null,
          headline: null,
          aiSummary: null,
          aiTags: [],
        },
      }

    case 'platform_product':
      // Use the platform product parser
      const platformResponse = await fetch('/api/platform/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const platformData = await platformResponse.json()
      return {
        modelType: 'platform_product',
        data: platformData.success ? platformData.data : null,
      }

    case 'milestone':
      // Basic milestone structure
      return {
        modelType: 'milestone',
        data: {
          title: null,
          description: null,
          category: null,
          milestoneType: null,
          date: null,
          sourceUrl: null,
        },
      }

    case 'external_pressure':
      // Basic external pressure structure
      return {
        modelType: 'external_pressure',
        data: {
          source: null,
          summary: null,
          category: null,
          impact: null,
        },
      }

    case 'external_env':
      // Basic external environment structure (same as external_pressure but company-wide)
      return {
        modelType: 'external_env',
        data: {
          source: null,
          summary: null,
          category: null,
          impact: null,
        },
      }

    // CompanyX types
    case 'training':
    case 'event':
    case 'career':
    case 'campaign':
    case 'impact_event':
    case 'community':
    case 'benefits':
    case 'employee_cause':
      const parsed = await parseCompanyXContent(rawText, modelType as ContextType)
      return {
        modelType,
        data: parsed.data,
      }

    default:
      throw new Error(`Unknown model type: ${modelType}`)
  }
}
