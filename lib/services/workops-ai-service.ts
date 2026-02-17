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
 * Split pasted text into multiple items when it looks like a list (bullets or numbered lines).
 * Returns array of non-empty segments; if no list structure detected, returns [rawText].
 */
export function splitBulkInput(rawText: string): string[] {
  const trimmed = rawText.trim()
  if (!trimmed) return []

  const lines = trimmed.split(/\r?\n/)
  const segments: string[] = []
  let current: string[] = []

  for (const line of lines) {
    const lineTrimmed = line.trim()
    if (!lineTrimmed) {
      if (current.length) {
        segments.push(current.join('\n').trim())
        current = []
      }
      continue
    }
    // New item: line starts with bullet or number
    if (/^[-*•]\s+/.test(lineTrimmed) || /^\d+[.)]\s+/.test(lineTrimmed)) {
      if (current.length) {
        segments.push(current.join('\n').trim())
        current = []
      }
      current.push(lineTrimmed.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, ''))
    } else {
      current.push(lineTrimmed)
    }
  }
  if (current.length) {
    segments.push(current.join('\n').trim())
  }

  // If we only have one segment, return as single item; otherwise return all
  const result = segments.filter((s) => s.length > 0)
  if (result.length <= 1) return trimmed ? [trimmed] : []
  return result
}

/**
 * Analyze multiple items from one pasted block (bulk). Splits input then analyzes each segment.
 */
export async function analyzeWorkItemIntentBulk(
  input: WorkItemAnalysisInput
): Promise<WorkItemAnalysisOutput[]> {
  const segments = splitBulkInput(input.rawText)
  if (segments.length === 0) return []
  if (segments.length === 1) {
    return [await analyzeWorkItemIntent({ ...input, rawText: segments[0] })]
  }
  const results = await Promise.all(
    segments.map((rawText) => analyzeWorkItemIntent({ ...input, rawText }))
  )
  return results
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

  const systemPrompt = `You are a work intelligence assistant. Your job is to analyze what the person really wants to DO and structure it as a work item. The title and body are shown to the person who wrote the input—they are the user. Write as if they are reading their own note, not a report about them.

Analyze the input and return JSON with:
{
  "title": "Clear, actionable title (max 100 chars). Use first person (I want to...) OR imperative (Get workshop series going). NEVER write 'The user wants...' or 'User wants...'—they are the user.",
  "body": "Full description or expanded details. Same voice: first person or neutral detail (e.g. bullet points). Never third-person 'user wants'.",
  "itemType": "One of: task, capture, meeting, signal, fire, boss_request, tech_work, admin, workforce_comms, external_pressure, personal",
  "urgency": "One of: low, medium, high, critical (or null if unclear)",
  "suggestedAction": "1-2 sentences for internal use only: what they want to accomplish (can be descriptive). Do not copy this into title/body as third person.",
  "extractedDetails": {
    "dueDate": "ISO date string if mentioned, or null",
    "people": ["array of people mentioned"],
    "projects": ["array of projects/initiatives mentioned"],
    "deadlines": ["array of deadline mentions"]
  }
}

Guidelines:
- title and body: first person or imperative only. Never "The user wants X" or "User wants X".
- If input is vague like "I want to get a workshop series going", title could be "Get workshop series going" or "Launch workshop series"; body can add detail.
- Extract deadlines, people, and projects into extractedDetails.
- Urgency from language (urgent, ASAP, critical = high/critical).
- For "my thoughts", clarify the action in title/body without switching to third person.
- For "boss", prioritize urgency and extract deadlines.
- For "company stuff", determine if it's an event, milestone, or initiative that needs action.

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

    // Defensive: never show third-person "user wants" to the person who wrote the note
    const cleanTitle = (parsed.title || input.rawText.substring(0, 100))
      .replace(/\b(the\s+)?user\s+wants\s+to\s+/gi, '')
      .replace(/^to\s+/i, '')
      .trim() || parsed.title || input.rawText.substring(0, 100)
    const cleanBody = (parsed.body || input.rawText)
      .replace(/\b(the\s+)?user\s+wants\s+to\s+/gi, '')
      .trim() || parsed.body || input.rawText

    return {
      title: cleanTitle,
      body: cleanBody,
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

