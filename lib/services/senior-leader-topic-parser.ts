/**
 * Senior Leader Topic Parser Service
 * 
 * Pure function that extracts high-level themes from SignalArtifact content.
 * Returns 3-7 topics with descriptions.
 * No DB writes, no side effects - just parsing.
 */

import OpenAI from 'openai'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface ParsedTopic {
  topic: string
  description: string | null
}

export interface TopicParseResult {
  topics: ParsedTopic[]
}

/**
 * Parse SignalArtifact content to extract high-level themes
 * 
 * Rules:
 * - Identify high-level themes only
 * - No facts, no directives, no routing
 * - Return 3-7 topics max
 * - Each topic should have a clear description
 */
export async function parseSeniorLeaderTopics(
  content: string
): Promise<TopicParseResult> {
  const openai = getOpenAI()

  const systemPrompt = `You are an expert at identifying high-level themes in senior leader communications.

Your task is to extract 3-7 high-level themes from the provided text.

RULES:
- Identify THEMES only (e.g., "Product Change", "Leadership Transition", "External Environment")
- Do NOT extract specific facts, dates, or directives
- Do NOT infer policy or milestones
- Do NOT create actionable items
- Focus on broad patterns and topics of discussion
- Each topic should be a clear, high-level category
- Descriptions should be short (1-2 sentences) and human-readable

Return ONLY valid JSON in this format:
{
  "topics": [
    {
      "topic": "Product Transformation",
      "description": "Senior leader discusses major changes to acquisition, platforms, and shipbuilding approach."
    },
    {
      "topic": "Leadership Continuity",
      "description": "Mentions interim leadership and reassures stability during transition."
    }
  ]
}`

  const userPrompt = `Extract high-level themes from this senior leader communication:

${content.substring(0, 8000)}`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    // Validate and normalize the response
    const topics: ParsedTopic[] = Array.isArray(parsed.topics)
      ? parsed.topics
          .slice(0, 7) // Max 7 topics
          .filter((t: any) => t && typeof t.topic === 'string' && t.topic.trim())
          .map((t: any) => ({
            topic: t.topic.trim(),
            description: typeof t.description === 'string' ? t.description.trim() : null,
          }))
      : []

    // Ensure we have at least 3 topics if possible, but don't force it
    if (topics.length === 0) {
      console.warn('[parseSeniorLeaderTopics] No topics extracted from content')
      return { topics: [] }
    }

    return { topics }
  } catch (error) {
    console.error('[parseSeniorLeaderTopics] Error:', error)
    return { topics: [] }
  }
}

