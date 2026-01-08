/**
 * CompanyX Topic Inference Service
 * --------------------------------
 * Uses hybrid logic:
 * 1. Deterministic keyword matching
 * 2. Pattern recognition
 * 3. LLM fallback for ambiguous cases
 */

import OpenAI from 'openai'
import type { ContextType } from '@/lib/types/context-type'
import { CONTEXT_TYPES } from '@/lib/types/context-type'

interface InferenceResult {
  type: ContextType
  confidence: number // 0–1
  explanation: string
}

const KEYWORDS: Record<ContextType, string[]> = {
  training: [
    'training',
    'mandatory training',
    'all hands training',
    'waypoints',
    'course',
    'learning',
    'session',
    'workshop',
    'briefing',
    'livestream',
    'run-hide-fight',
    'certification',
    'certificate',
    'required training',
    'compliance training',
  ],
  career: [
    'career',
    'professional development',
    'fellowship',
    'leadership program',
    'ccas',
    'assessment cycle',
    'promotion',
    'nominations are open',
    'application package',
    'career development',
    'advancement',
    'opportunity',
  ],
  benefits: [
    'benefits',
    'open season',
    'fehb',
    'fedvip',
    'fsafeds',
    'health insurance',
    'dental',
    'vision',
    'enrollment window',
    'enrollment period',
    'benefits enrollment',
  ],
  campaign: [
    'campaign',
    'initiative',
    'push',
    'awareness',
    'outreach',
    'spotlight',
    'call to action',
    'drive',
    'program launch',
  ],
  impact_event: [
    'impact',
    'incident',
    'outage',
    'disruption',
    'emergency',
    'closure',
    'delay',
    'system down',
    'maintenance',
    'interruption',
  ],
  community: [
    'community',
    'volunteer',
    'service',
    'outreach',
    'team event',
    'morale',
    'fundraiser',
    'charity',
    'donation',
    'giving',
  ],
  event: [
    'event',
    'meeting',
    'gathering',
    'celebration',
    'lunch',
    'dinner',
    'reception',
  ],
  leader_engagement: [
    'town hall',
    'all hands',
    'all-hands',
    'leadership briefing',
    'leadership engagement',
    'state of the org',
    'state of the organization',
    'executive update',
    'senior leadership',
    'leadership meeting',
    'q&a session',
    'question and answer',
    'leader address',
    'executive address',
  ],
  employee_cause: [
    'employee cause',
    'employee drive',
    'employee collection',
    'employee fundraiser',
    'employee initiative',
  ],
}

/**
 * Deterministic keyword scoring
 */
function scoreByKeywords(text: string): Record<ContextType, number> {
  const lower = text.toLowerCase()
  const scores: Record<ContextType, number> = {
    training: 0,
    career: 0,
    benefits: 0,
    campaign: 0,
    impact_event: 0,
    community: 0,
    event: 0,
    leader_engagement: 0,
    employee_cause: 0,
  }

  for (const type of Object.keys(KEYWORDS) as ContextType[]) {
    for (const kw of KEYWORDS[type]) {
      if (lower.includes(kw)) scores[type] += 1
    }
  }

  return scores
}

/**
 * Choose deterministic type if confidence is high
 */
function chooseDeterministic(scores: Record<ContextType, number>): ContextType | null {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const [topType, topScore] = sorted[0]

  // If we clearly have a winner (>=2 signals), lock it in
  if (topScore >= 2) return topType as ContextType

  // Otherwise ambiguous
  return null
}

/**
 * Fallback to GPT for ambiguous text
 */
async function llmFallback(text: string): Promise<InferenceResult> {
  function getOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  const openai = getOpenAI()

  const prompt = `You are a classification model. Read the following NAVSEA workforce announcement and classify it into exactly one CompanyX type:

Valid CompanyX types:
- training (training programs, courses, learning, workshops, certifications, mandatory training)
- event (company events, gatherings, meetings, celebrations, social events)
- leader_engagement (town halls, all-hands meetings, leadership briefings, state of the organization, executive updates, senior leadership meetings, Q&A sessions with leaders, leader addresses)
- campaign (company campaigns, initiatives, drives, awareness programs, outreach efforts)
- impact_event (disruptions, changes affecting workforce, announcements, outages, emergencies)
- benefits (benefits enrollment, open season, health benefits, FEHB, FEDVIP, FSAFEDS)
- community (community engagement, volunteer opportunities, outreach, service events)
- career (career development, promotions, opportunities, job postings, professional development)
- employee_cause (employee causes, drives, collections, fundraisers, employee initiatives)

Return ONLY JSON:
{
  "type": "one of the types above",
  "confidence": 0.0 to 1.0,
  "explanation": "short explanation"
}

Text:
${text.substring(0, 2000)}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at classifying workforce communication content. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    // Validate type - use CONTEXT_TYPES for consistency
    const inferredType = CONTEXT_TYPES.includes(result.type) ? result.type : 'training'

    return {
      type: inferredType,
      confidence: result.confidence || 0.7,
      explanation: result.explanation || 'LLM inference',
    }
  } catch (error) {
    console.error('LLM fallback error:', error)
    return {
      type: 'training',
      confidence: 0.4,
      explanation: 'Fallback default due to LLM error',
    }
  }
}

/**
 * MAIN ENTRYPOINT
 * 
 * ALWAYS returns a valid CompanyXType enum.
 * Never returns null, undefined, or placeholder types.
 * Inference always runs - no conditional skipping.
 */
export async function inferCompanyXType(text: string): Promise<InferenceResult> {
  // Validate input
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    // Even for empty text, return a valid type (training as safe default)
    return {
      type: 'training',
      confidence: 0.3,
      explanation: 'Empty text - defaulting to training',
    }
  }

  const scores = scoreByKeywords(text)

  const deterministicType = chooseDeterministic(scores)
  if (deterministicType) {
    return {
      type: deterministicType,
      confidence: 0.9,
      explanation: `Determined by keyword match: ${deterministicType}`,
    }
  }

  // Fallback to GPT - ALWAYS returns a valid type
  return await llmFallback(text)
}

