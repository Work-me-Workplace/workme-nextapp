/**
 * PlatformUpdateService
 * 
 * Service that processes news articles/statements about platform products,
 * extracts structured updates, and infers changes to platform product fields.
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface StatementParseResult {
  sourceName: string | null
  sourceUrl: string | null
  headline: string | null
  aiSummary: string | null
  aiTags: string[]
}

export interface UpdateParseResult {
  scheduleStatus: string | null
  costStatus: string | null
  industrialBaseNote: string | null
  leadershipQuote: string | null
  percentCompleteEstimate: number | null
  override_intendedTotalUnits: number | null
  override_programStatus: string | null
  override_currentProgressEstimate: number | null
  narrativeSummary: string | null
  tags: string[]
}

/**
 * Parse a news article/statement to extract metadata and summary
 * Pure function - no side effects
 */
export async function parseStatement(rawText: string, sourceUrl?: string): Promise<StatementParseResult> {
  const openai = getOpenAI()

  const prompt = `Analyze this news article or statement about a defense platform/product.

Extract and return JSON with these fields:
{
  "sourceName": "Publication or source name (e.g., 'USNI News', 'DoD Release', 'GD CEO Earnings Call') or null",
  "sourceUrl": "URL if provided or null",
  "headline": "Article headline or main title or null",
  "aiSummary": "2-3 sentence summary of the key points",
  "aiTags": ["array", "of", "relevant", "tags"] // e.g., ["schedule", "industrial base", "cost", "delivery", "testing"]
}

Text:
${rawText.substring(0, 4000)}`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing defense industry news and extracting structured metadata. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    return {
      sourceName: parsed.sourceName || null,
      sourceUrl: parsed.sourceUrl || sourceUrl || null,
      headline: parsed.headline || null,
      aiSummary: parsed.aiSummary || null,
      aiTags: Array.isArray(parsed.aiTags) ? parsed.aiTags : [],
    }
  } catch (error) {
    console.error('PlatformUpdateService.parseStatement error:', error)
    return {
      sourceName: null,
      sourceUrl: sourceUrl || null,
      headline: null,
      aiSummary: null,
      aiTags: [],
    }
  }
}

/**
 * Parse a statement to extract structured update information
 * Pure function - no side effects
 */
export async function parseUpdate(
  rawText: string,
  platformContext?: {
    name: string
    currentProgramStatus?: string | null
    currentIntendedTotalUnits?: number | null
    currentProgressEstimate?: number | null
  }
): Promise<UpdateParseResult> {
  const openai = getOpenAI()

  const contextInfo = platformContext
    ? `\n\nContext about ${platformContext.name}:
- Current Program Status: ${platformContext.currentProgramStatus || 'Unknown'}
- Intended Total Units: ${platformContext.currentIntendedTotalUnits || 'Unknown'}
- Current Progress Estimate: ${platformContext.currentProgressEstimate || 'Unknown'}%`
    : ''

  const prompt = `Extract structured update information from this news article about a defense platform.

Return JSON with these fields:
{
  "scheduleStatus": "Schedule status if mentioned (e.g., 'Behind', 'Ahead', 'Critical Path Issue', 'On Schedule') or null",
  "costStatus": "Cost status if mentioned (e.g., 'Cost Growth', 'Stable', 'Rebaseline', 'Under Budget') or null",
  "industrialBaseNote": "Industrial base issues if mentioned (e.g., 'Labor shortage', 'supplier delays', 'material constraints') or null",
  "leadershipQuote": "Relevant quote from leadership or key personnel or null",
  "percentCompleteEstimate": "Program completion percentage if mentioned (0-100 integer) or null",
  "override_intendedTotalUnits": "New intended total units if mentioned (integer) or null",
  "override_programStatus": "New program status if mentioned (e.g., 'On Track', 'Delayed', 'Rebaseline Expected') or null",
  "override_currentProgressEstimate": "New progress estimate if mentioned (0-100 integer) or null",
  "narrativeSummary": "Structured summary of what changed or was reported",
  "tags": ["array", "of", "tags"] // e.g., ["schedule", "cost", "delivery", "testing"]
}

Only include override fields if the article explicitly states a change to those values.
${contextInfo}

Text:
${rawText.substring(0, 4000)}`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured update information from defense industry news. Return only valid JSON. Only include override fields if the article explicitly states a change.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    return {
      scheduleStatus: parsed.scheduleStatus || null,
      costStatus: parsed.costStatus || null,
      industrialBaseNote: parsed.industrialBaseNote || null,
      leadershipQuote: parsed.leadershipQuote || null,
      percentCompleteEstimate:
        typeof parsed.percentCompleteEstimate === 'number' && parsed.percentCompleteEstimate >= 0 && parsed.percentCompleteEstimate <= 100
          ? parsed.percentCompleteEstimate
          : null,
      override_intendedTotalUnits:
        typeof parsed.override_intendedTotalUnits === 'number' ? parsed.override_intendedTotalUnits : null,
      override_programStatus: parsed.override_programStatus || null,
      override_currentProgressEstimate:
        typeof parsed.override_currentProgressEstimate === 'number' &&
        parsed.override_currentProgressEstimate >= 0 &&
        parsed.override_currentProgressEstimate <= 100
          ? parsed.override_currentProgressEstimate
          : null,
      narrativeSummary: parsed.narrativeSummary || null,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    }
  } catch (error) {
    console.error('PlatformUpdateService.parseUpdate error:', error)
    return {
      scheduleStatus: null,
      costStatus: null,
      industrialBaseNote: null,
      leadershipQuote: null,
      percentCompleteEstimate: null,
      override_intendedTotalUnits: null,
      override_programStatus: null,
      override_currentProgressEstimate: null,
      narrativeSummary: null,
      tags: [],
    }
  }
}

/**
 * Process a news article: create statement, parse update, and optionally infer platform changes
 * This function DOES write to the database
 */
export async function processNewsArticle(
  platformProductId: string,
  rawText: string,
  options?: {
    sourceUrl?: string
    autoApplyUpdates?: boolean // If true, automatically apply override fields to platform
  }
): Promise<{
  statement: any
  update: any
  platformUpdated: boolean
}> {
  // 1. Get platform context for better parsing
  const platform = await prisma.companyPlatformProduct.findUnique({
    where: { id: platformProductId },
    select: {
      name: true,
      programStatus: true,
      intendedTotalUnits: true,
      currentProgressEstimate: true,
    },
  })

  if (!platform) {
    throw new Error(`Platform product not found: ${platformProductId}`)
  }

  // 2. Parse statement metadata
  const statementData = await parseStatement(rawText, options?.sourceUrl)

  // 3. Create statement record
  const statement = await prisma.companyPlatformStatement.create({
    data: {
      platformProductId,
      sourceName: statementData.sourceName,
      sourceUrl: statementData.sourceUrl,
      headline: statementData.headline,
      rawText,
      aiSummary: statementData.aiSummary,
      aiTags: statementData.aiTags,
    },
  })

  // 4. Parse update information
  const updateData = await parseUpdate(rawText, {
    name: platform.name,
    currentProgramStatus: platform.programStatus,
    currentIntendedTotalUnits: platform.intendedTotalUnits,
    currentProgressEstimate: platform.currentProgressEstimate,
  })

  // 5. Create update record
  const update = await prisma.companyPlatformUpdate.create({
    data: {
      platformProductId,
      statementId: statement.id,
      scheduleStatus: updateData.scheduleStatus,
      costStatus: updateData.costStatus,
      industrialBaseNote: updateData.industrialBaseNote,
      leadershipQuote: updateData.leadershipQuote,
      percentCompleteEstimate: updateData.percentCompleteEstimate,
      override_intendedTotalUnits: updateData.override_intendedTotalUnits,
      override_programStatus: updateData.override_programStatus,
      override_currentProgressEstimate: updateData.override_currentProgressEstimate,
      narrativeSummary: updateData.narrativeSummary,
      tags: updateData.tags,
    },
  })

  // 6. Optionally apply overrides to platform product
  let platformUpdated = false
  if (options?.autoApplyUpdates) {
    const updateFields: any = {}

    if (updateData.override_intendedTotalUnits !== null) {
      updateFields.intendedTotalUnits = updateData.override_intendedTotalUnits
    }
    if (updateData.override_programStatus !== null) {
      updateFields.programStatus = updateData.override_programStatus
    }
    if (updateData.override_currentProgressEstimate !== null) {
      updateFields.currentProgressEstimate = updateData.override_currentProgressEstimate
    }

    if (Object.keys(updateFields).length > 0) {
      await prisma.companyPlatformProduct.update({
        where: { id: platformProductId },
        data: updateFields,
      })
      platformUpdated = true
    }
  }

  return {
    statement,
    update,
    platformUpdated,
  }
}

/**
 * Infer platform product changes from all recent updates
 * This analyzes all updates and suggests changes to the platform product
 */
export async function inferPlatformChanges(platformProductId: string): Promise<{
  suggestedChanges: {
    intendedTotalUnits?: number
    programStatus?: string
    currentProgressEstimate?: number
  }
  confidence: 'high' | 'medium' | 'low'
}> {
  // Get recent updates (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentUpdates = await prisma.companyPlatformUpdate.findMany({
    where: {
      platformProductId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (recentUpdates.length === 0) {
    return {
      suggestedChanges: {},
      confidence: 'low',
    }
  }

  // Analyze override fields from recent updates
  const overrideCounts = {
    intendedTotalUnits: new Map<number, number>(),
    programStatus: new Map<string, number>(),
    currentProgressEstimate: new Map<number, number>(),
  }

  for (const update of recentUpdates) {
    if (update.override_intendedTotalUnits !== null) {
      const count = overrideCounts.intendedTotalUnits.get(update.override_intendedTotalUnits) || 0
      overrideCounts.intendedTotalUnits.set(update.override_intendedTotalUnits, count + 1)
    }
    if (update.override_programStatus !== null) {
      const count = overrideCounts.programStatus.get(update.override_programStatus) || 0
      overrideCounts.programStatus.set(update.override_programStatus, count + 1)
    }
    if (update.override_currentProgressEstimate !== null) {
      const count = overrideCounts.currentProgressEstimate.get(update.override_currentProgressEstimate) || 0
      overrideCounts.currentProgressEstimate.set(update.override_currentProgressEstimate, count + 1)
    }
  }

  // Find most common override values
  const suggestedChanges: any = {}
  let confidence: 'high' | 'medium' | 'low' = 'low'

  // Intended Total Units
  if (overrideCounts.intendedTotalUnits.size > 0) {
    const mostCommon = Array.from(overrideCounts.intendedTotalUnits.entries()).sort((a, b) => b[1] - a[1])[0]
    if (mostCommon[1] >= 2) {
      suggestedChanges.intendedTotalUnits = mostCommon[0]
      confidence = mostCommon[1] >= 3 ? 'high' : 'medium'
    }
  }

  // Program Status
  if (overrideCounts.programStatus.size > 0) {
    const mostCommon = Array.from(overrideCounts.programStatus.entries()).sort((a, b) => b[1] - a[1])[0]
    if (mostCommon[1] >= 2) {
      suggestedChanges.programStatus = mostCommon[0]
      if (confidence === 'low') {
        confidence = mostCommon[1] >= 3 ? 'high' : 'medium'
      }
    }
  }

  // Progress Estimate
  if (overrideCounts.currentProgressEstimate.size > 0) {
    const mostCommon = Array.from(overrideCounts.currentProgressEstimate.entries()).sort((a, b) => b[1] - a[1])[0]
    if (mostCommon[1] >= 2) {
      suggestedChanges.currentProgressEstimate = mostCommon[0]
      if (confidence === 'low') {
        confidence = mostCommon[1] >= 3 ? 'high' : 'medium'
      }
    }
  }

  return {
    suggestedChanges,
    confidence,
  }
}

/**
 * Apply suggested changes to platform product
 */
export async function applyPlatformChanges(
  platformProductId: string,
  changes: {
    intendedTotalUnits?: number
    programStatus?: string
    currentProgressEstimate?: number
  }
): Promise<void> {
  const updateFields: any = {}

  if (changes.intendedTotalUnits !== undefined) {
    updateFields.intendedTotalUnits = changes.intendedTotalUnits
  }
  if (changes.programStatus !== undefined) {
    updateFields.programStatus = changes.programStatus
  }
  if (changes.currentProgressEstimate !== undefined) {
    updateFields.currentProgressEstimate = changes.currentProgressEstimate
  }

  if (Object.keys(updateFields).length > 0) {
    await prisma.companyPlatformProduct.update({
      where: { id: platformProductId },
      data: updateFields,
    })
  }
}
