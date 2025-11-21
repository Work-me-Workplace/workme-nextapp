/**
 * NTK (Need to Know) Generator Service
 * 
 * Uses OpenAI to normalize unstructured text into structured NTK format
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

'use server'

import OpenAI from 'openai'

// Initialize OpenAI client (uses OPENAI_API_KEY from env)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * NTK Structure
 * Standard format for Need-to-Know communications
 */
export interface NTKStructure {
  title: string
  summary: string // Brief overview (2-3 sentences)
  keyPoints: string[] // 3-7 bullet points
  actionItems: string[] // What readers need to do
  deadline?: string // Optional deadline
  contactInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  relatedLinks?: string[] // URLs or references
  tags?: string[] // Keywords for categorization
}

/**
 * Generate structured NTK from raw text
 * 
 * @param sourceText - Raw text input (manual entry, CSV content, or previous NTK)
 * @returns Structured NTK object
 */
export async function generateNTK(sourceText: string): Promise<NTKStructure> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  if (!sourceText || sourceText.trim().length === 0) {
    throw new Error('Source text cannot be empty')
  }

  console.log('[NTK Generator] Starting generation...', {
    textLength: sourceText.length,
  })

  try {
    const prompt = `You are an expert at normalizing workplace communications into clear, structured "Need to Know" (NTK) format.

Analyze the following text and extract key information into a structured NTK format:

---
${sourceText}
---

Return ONLY valid JSON in this exact structure:
{
  "title": "Clear, concise title (5-10 words)",
  "summary": "Brief overview in 2-3 sentences explaining the key message",
  "keyPoints": ["First key point", "Second key point", "Third key point"],
  "actionItems": ["Action item 1", "Action item 2"],
  "deadline": "MM/DD/YYYY or 'None' if no deadline",
  "contactInfo": {
    "name": "Name or null",
    "email": "Email or null",
    "phone": "Phone or null"
  },
  "relatedLinks": ["URL1", "URL2"] or [],
  "tags": ["keyword1", "keyword2"] or []
}

Rules:
- Include 3-7 key points (most important information)
- Include action items only if the text explicitly states what readers must do
- Extract deadlines in MM/DD/YYYY format or return "None"
- Extract contact info if mentioned, otherwise use null
- Extract URLs if mentioned, otherwise return empty array
- Tags should be relevant keywords (3-5 max)
- Keep language clear and professional
- Return valid JSON only, no markdown formatting`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are a workplace communication expert. Always return valid JSON only.',
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

    // Validate required fields
    if (!ntk.title || !ntk.summary || !Array.isArray(ntk.keyPoints)) {
      throw new Error('OpenAI returned invalid NTK structure')
    }

    // Clean up deadline - convert "None" to undefined
    if (ntk.deadline === 'None' || ntk.deadline === 'none' || ntk.deadline === '') {
      ntk.deadline = undefined
    }

    // Ensure arrays are defined
    ntk.actionItems = ntk.actionItems || []
    ntk.relatedLinks = ntk.relatedLinks || []
    ntk.tags = ntk.tags || []

    console.log('[NTK Generator] SUCCESS', {
      title: ntk.title,
      keyPointsCount: ntk.keyPoints.length,
      actionItemsCount: ntk.actionItems.length,
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

/**
 * Parse CSV text into sourceText
 * Simple CSV parser for NTK input
 */
export function parseCSVToText(csvContent: string): string {
  const lines = csvContent.trim().split('\n')
  
  // Skip header row if it exists
  const dataLines = lines.slice(1).filter(line => line.trim().length > 0)
  
  // Join all rows into text
  return dataLines.join('\n\n')
}

