/**
 * WorkOps AI Service
 * 
 * Analyzes user input to understand what they really want to do
 * and structures it as a proper WorkOpsItem
 */

import OpenAI from 'openai'
import { WorkOpsItemType, WorkOpsUrgency } from '@prisma/client'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface WorkItemAnalysisInput {
  rawText: string
  category: 'my_thoughts' | 'boss' | 'company_stuff'
}

export interface WorkItemAnalysisOutput {
  title: string
  body: string | null
  itemType: WorkOpsItemType
  urgency: WorkOpsUrgency | null
  suggestedAction: string | null // What the user really wants to do
  extractedDetails: {
    dueDate?: string | null
    people?: string[]
    projects?: string[]
    deadlines?: string[]
  }
}

/**
 * Analyze user input to understand intent and structure as work item
 */
export async function analyzeWorkItemIntent(
  input: WorkItemAnalysisInput
): Promise<WorkItemAnalysisOutput> {
  const openai = getOpenAI()

  const categoryContext = {
    my_thoughts: 'This is a thought, idea, or thing the user wants to remember. Help them clarify what they really want to DO with this thought.',
    boss: 'This is a task or request from the user\'s boss or supervisor. Extract the actual task and any deadlines or urgency.',
    company_stuff: 'This is related to company events, milestones, employee highlights, or initiatives. Determine what action is needed.',
  }

  const systemPrompt = `You are a work intelligence assistant. Your job is to analyze what the user really wants to DO, not just save their idea.

Analyze the input and return JSON with:
{
  "title": "Clear, actionable title (max 100 chars) - what do they want to DO?",
  "body": "Full original text or expanded description",
  "itemType": "One of: task, capture, meeting, signal, fire, boss_request, tech_work, admin, workforce_comms, external_pressure, personal",
  "urgency": "One of: low, medium, high, critical (or null if unclear)",
  "suggestedAction": "1-2 sentences explaining what they really want to accomplish",
  "extractedDetails": {
    "dueDate": "ISO date string if mentioned, or null",
    "people": ["array of people mentioned"],
    "projects": ["array of projects/initiatives mentioned"],
    "deadlines": ["array of deadline mentions"]
  }
}

Guidelines:
- If it's vague like "I want to get a workshop series going", suggest a concrete first step
- Extract deadlines, people, and projects mentioned
- Determine urgency based on language (urgent, ASAP, critical = high/critical)
- For "my thoughts", help clarify the action - what do they want to DO with this thought?
- For "boss", prioritize urgency and extract deadlines
- For "company stuff", determine if it's an event, milestone, or initiative that needs action

Return ONLY valid JSON, no other text.`

  const userPrompt = `Category: ${input.category}
Context: ${categoryContext[input.category]}

User input:
${input.rawText}

Analyze what they really want to DO and structure it as a work item.`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No content from OpenAI')
    }

    const parsed = JSON.parse(content)

    // Map to proper enums
    const itemTypeMap: Record<string, WorkOpsItemType> = {
      task: WorkOpsItemType.task,
      capture: WorkOpsItemType.capture,
      meeting: WorkOpsItemType.meeting,
      signal: WorkOpsItemType.signal,
      fire: WorkOpsItemType.fire,
      boss_request: WorkOpsItemType.boss_request,
      tech_work: WorkOpsItemType.tech_work,
      admin: WorkOpsItemType.admin,
      workforce_comms: WorkOpsItemType.workforce_comms,
      external_pressure: WorkOpsItemType.external_pressure,
      personal: WorkOpsItemType.personal,
    }

    const urgencyMap: Record<string, WorkOpsUrgency> = {
      low: WorkOpsUrgency.low,
      medium: WorkOpsUrgency.medium,
      high: WorkOpsUrgency.high,
      critical: WorkOpsUrgency.critical,
    }

    return {
      title: parsed.title || input.rawText.substring(0, 100),
      body: parsed.body || input.rawText,
      itemType: itemTypeMap[parsed.itemType] || WorkOpsItemType.capture,
      urgency: parsed.urgency ? urgencyMap[parsed.urgency] : null,
      suggestedAction: parsed.suggestedAction || null,
      extractedDetails: parsed.extractedDetails || {},
    }
  } catch (error) {
    console.error('WorkOps AI analysis error:', error)
    // Fallback to simple capture
    return {
      title: input.rawText.substring(0, 100),
      body: input.rawText,
      itemType: WorkOpsItemType.capture,
      urgency: null,
      suggestedAction: null,
      extractedDetails: {},
    }
  }
}

