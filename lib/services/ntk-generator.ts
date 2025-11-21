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
 * @returns Structured NTK object
 */
export async function generateNTK(sourceText: string): Promise<NTKStructure> {
  if (!sourceText || sourceText.trim().length === 0) {
    throw new Error('Source text cannot be empty')
  }

  console.log('[NTK Generator] Starting generation...', {
    textLength: sourceText.length,
  })

  try {
    const openai = getOpenAIClient()
    const prompt = `You are a NAVSEA Internal Communications writer supporting the weekly "Need to Know" workforce email. Rewrite the following item into a short, clear blurb following these rules:

---
${sourceText}
---

1. HEADER FORMAT
   • Use the exact event title provided.
   • Create a NAVSEA-style header line formatted as:
       [TITLE IN ALL CAPS] – [MONTH WRITTEN AS TEXT, NO PERIOD] [DAY]
     Example: 
       DEOCS SURVEY EXTENDED – NOV 30

2. DATE HANDLING
   • Extract the date from the input text or CSV summary.
   • Use the MONTH spelled out ("NOV", "DEC", "JAN") with no punctuation.
   • Use the DAY number only (no leading zeros).

3. POC FORMAT
   • Show POC in *italics* using markdown.
   • Format as: *POC: [name & email]*
   • If multiple POCs, list each on its own line.
   • If no POC found, use: *POC: Not specified*

4. SUMMARY STYLE
   • Lead with what's important or what the workforce must DO.
   • Use action-oriented present-tense language (e.g., "Submit…", "Complete…", "Take…").
   • Keep it concise, direct, and workforce-focused (2-4 sentences).
   • If the system detects the item has appeared before, refresh phrasing so it is not repetitive.
     (Use synonyms, reorder content, or tighten clarity.)
   • Maintain NAVSEA voice: neutral, informative, operationally focused.
   • If relevant, include:
       – deadlines
       – what the employee is expected to do
       – what system or link is used
       – any major changes (extended, updated, shifted timelines)

5. PROHIBITED
   • No hype language ("exciting," "great opportunity," "don't miss").
   • No emojis.
   • No exclamation points.
   • Do not editorialize.

Return ONLY valid JSON in this exact structure:
{
  "header": "[TITLE IN ALL CAPS] – [MONTH] [DAY]",
  "poc": "*POC: [name & email]*",
  "summary": "2-4 sentence summary in NAVSEA tone, action-oriented, present-tense",
  "title": "Original title for reference",
  "deadline": "MM/DD/YYYY or null if no deadline",
  "contactInfo": {
    "name": "Name or null",
    "email": "Email or null",
    "phone": "Phone or null"
  },
  "relatedLinks": ["URL1", "URL2"] or [],
  "tags": ["keyword1", "keyword2"] or []
}

OUTPUT FORMAT (in this exact order):
[HEADER LINE]

*POC: [name & email]*

[2–4 sentence summary in NAVSEA tone]

Return valid JSON only, no markdown formatting outside of the poc field.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are a NAVSEA Internal Communications writer. Always return valid JSON only. Follow NAVSEA formatting rules strictly: neutral tone, action-oriented, no hype language, no emojis, no exclamation points.',
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


