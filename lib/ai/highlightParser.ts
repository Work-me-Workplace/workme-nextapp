/**
 * Highlight Parser Service
 * 
 * Pure function that extracts structured employee highlight data from raw citation text.
 * No DB writes, no side effects - just parsing.
 */

import OpenAI from 'openai'
import { mapStringToClassification, HighlightClassification } from '@/lib/config/highlightClassification'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface ParsedHighlight {
  fullName: string
  title?: string | null
  unit?: string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  achievement?: string | null
  narrative?: string | null
  classification?: HighlightClassification | string | null
  supervisorQuote?: string | null
  citationText: string // MUST return full verbatim text
}

/**
 * Parse highlight data from raw citation text
 * Pure function - no side effects
 */
export async function parseHighlight(raw: string): Promise<ParsedHighlight> {
  const openai = getOpenAI()

  const prompt = `Extract structured employee highlight information from this award citation or recognition text.

Return JSON with these exact fields:
{
  "fullName": "Full name of the person (REQUIRED)",
  "title": "Job title, role, or billet (e.g., 'Engineer', 'TWH', 'Analyst') or null",
  "unit": "Organizational unit (e.g., 'NAVSEA 05', 'SEA 08') or null",
  "awardName": "Name of the award (e.g., 'Rosenblatt Young Naval Engineer Award') or null",
  "awardingAgency": "Organization giving the award (e.g., 'American Society of Naval Engineers') or null",
  "awardYear": Year as number (e.g., 2024) or null,
  "achievement": "Single-sentence distilled summary of what they achieved or null",
  "narrative": "Optional AI-synthesized story or narrative or null",
  "classification": "Category: 'EXCELLENCE' (for Achievement/Award), 'LEADERSHIP' (for Promotion/new leadership role), 'INNOVATION' (for Patent/technical breakthrough), 'SERVICE' (for Volunteer recognition), 'IMPACT' (for Mission impact/high-visibility accomplishment), or null",
  "supervisorQuote": "Quote from supervisor or leadership about the employee or null",
  "citationText": "FULL VERBATIM citation text - preserve EXACTLY as provided (REQUIRED)"
}

IMPORTANT:
- Extract clean entities from the citation
- Preserve the long-form citationText EXACTLY as provided in the input
- If fields are missing in source, return null for those fields
- Do NOT hallucinate or invent information
- Return only valid JSON

Citation text:
${raw.substring(0, 4000)}`

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured employee highlight and award citation information from workforce communications. Return only valid JSON.',
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

    // Validate and normalize - ensure citationText is preserved
    // Map classification string to enum if provided
    const rawClassification = parsed.classification || null
    const mappedClassification = rawClassification 
      ? (mapStringToClassification(rawClassification) || (Object.values(HighlightClassification).includes(rawClassification as HighlightClassification) ? rawClassification : null))
      : null

    return {
      fullName: parsed.fullName || '',
      title: parsed.title || null,
      unit: parsed.unit || null,
      awardName: parsed.awardName || null,
      awardingAgency: parsed.awardingAgency || null,
      awardYear: parsed.awardYear ? parseInt(String(parsed.awardYear)) : null,
      achievement: parsed.achievement || null,
      narrative: parsed.narrative || null,
      classification: mappedClassification,
      supervisorQuote: parsed.supervisorQuote || null,
      citationText: parsed.citationText || raw, // Fallback to original if not extracted
    }
  } catch (error) {
    console.error('HighlightParser error:', error)
    // Return safe defaults on error, preserving original text
    return {
      fullName: '',
      title: null,
      unit: null,
      awardName: null,
      awardingAgency: null,
      awardYear: null,
      achievement: null,
      narrative: null,
      classification: null,
      supervisorQuote: null,
      citationText: raw,
    }
  }
}

