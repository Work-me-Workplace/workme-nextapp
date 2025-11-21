/**
 * NTK (Need to Know) Generator Service
 * 
 * Uses OpenAI to normalize unstructured text into structured NTK format
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 * This file is only used in API routes (/app/api/**)
 */

import OpenAI from 'openai'
import type { NTKStructure } from '@/lib/types/ntk'

// Re-export for backwards compatibility (server-only imports)
export type { NTKStructure } from '@/lib/types/ntk'

// Initialize OpenAI client (uses OPENAI_API_KEY from env)
// Lazy initialization to prevent build-time errors if env var is missing
let openaiInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

/**
 * Generate structured NTK from raw text
 * 
 * @param sourceText - Raw text input (manual entry, CSV content, or previous NTK)
 * @param feedback - Optional user feedback for regeneration
 * @returns Structured NTK object
 */
export async function generateNTK(
  sourceText: string,
  feedback?: string,
): Promise<NTKStructure> {
  if (!sourceText || sourceText.trim().length === 0) {
    throw new Error('Source text cannot be empty')
  }

  console.log('[NTK Generator] Starting generation...', {
    textLength: sourceText.length,
  })

  try {
    const openai = getOpenAIClient()
    
    // Build prompt with optional feedback
    let prompt = `Rewrite the following workplace update in clear, concise, plain internal communication ("Need to Know") style.

Do not use emojis or decorative language.
Avoid marketing tone or filler.
Use factual, direct sentences.
Focus on clarity and accuracy.

Input:

${sourceText}`

    // Add feedback if provided
    if (feedback && feedback.trim().length > 0) {
      prompt += `\n\nIf user feedback is provided, incorporate it:

${feedback}`
    }

    prompt += `\n\nReturn ONLY valid JSON in this exact structure:
{
  "header": "[TITLE IN ALL CAPS] – [MONTH] [DAY]",
  "poc": "*POC: [name & email]*",
  "summary": "2-4 sentence summary in plain language, action-oriented, present-tense",
  "title": "Original title for reference",
  "deadline": "MM/DD/YYYY or null if no deadline",
  "contactInfo": {
    "name": "Name or null",
    "email": "Email or null",
    "phone": "Phone or null"
  },
  "relatedLinks": ["URL1", "URL2"] or [],
  "tags": ["keyword1", "keyword2"] or []
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are an internal communications writer. Always return valid JSON only. Use plain language, neutral tone, action-oriented, no hype language, no emojis, no exclamation points. Focus on clarity and accuracy.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent structure
      response_format: { type: 'json_object' }, // Force JSON output
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('OpenAI returned empty response')
    }

    // Parse JSON response
    let ntk: NTKStructure
    try {
      ntk = JSON.parse(content)
    } catch (parseError) {
      console.error('[NTK Generator] Failed to parse JSON:', content)
      throw new Error('Failed to parse OpenAI response as JSON')
    }

    // Validate required fields (NAVSEA format)
    if (!ntk.header || !ntk.poc || !ntk.summary) {
      throw new Error('OpenAI returned invalid NTK structure - missing required NAVSEA fields')
    }

    // Ensure title exists (for compatibility, use header if title missing)
    if (!ntk.title) {
      ntk.title = ntk.header
    }

    // Clean up deadline - convert "None" to undefined
    if (ntk.deadline === 'None' || ntk.deadline === 'none' || ntk.deadline === '') {
      ntk.deadline = undefined
    }

    // Ensure arrays are defined (optional fields)
    ntk.keyPoints = ntk.keyPoints || []
    ntk.actionItems = ntk.actionItems || []
    ntk.relatedLinks = ntk.relatedLinks || []
    ntk.tags = ntk.tags || []

    console.log('[NTK Generator] SUCCESS', {
      header: ntk.header,
      title: ntk.title,
      hasPoc: !!ntk.poc,
      summaryLength: ntk.summary.length,
    })

    return ntk
  } catch (error: any) {
    console.error('[NTK Generator] ERROR:', {
      error: error.message,
      stack: error.stack,
    })

    // Re-throw with clear error message
    if (error.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing')
    }
    if (error.message?.includes('rate limit')) {
      throw new Error('OpenAI rate limit exceeded. Please try again in a moment.')
    }

    throw new Error(`NTK generation failed: ${error.message || 'Unknown error'}`)
  }
}


