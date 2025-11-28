/**
 * TrainingParserService
 * 
 * Pure function that extracts structured training data from raw text.
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

export interface TrainingModel {
  title: string | null
  description: string | null
  mandatory: boolean
  topic: string | null
  sponsoringOffice: string | null
  trainingDate: string | null // ISO date string
  startTime: string | null // "09:00"
  endTime: string | null // "10:30"
  location: string | null
  format: 'in-person' | 'virtual' | 'hybrid' | null
  link: string | null // First livestream link
  poc: {
    name: string | null
    email: string | null
    phone: string | null
    rankOrTitle: string | null
  }
}

/**
 * Parse training data from raw text
 * Pure function - no side effects
 */
export async function parseTraining(rawText: string): Promise<TrainingModel> {
  const openai = getOpenAI()

  const prompt = `Extract structured training information from this NAVSEA workforce communication text.

Return JSON with these exact fields:
{
  "title": "Training title or name (or null)",
  "description": "Full description (or null)",
  "mandatory": true or false,
  "topic": "Training topic/subject (or null)",
  "sponsoringOffice": "Office or organization sponsoring (or null)",
  "trainingDate": "ISO date string (YYYY-MM-DD) or null",
  "startTime": "Time string in HH:MM format (e.g., '09:00') or null",
  "endTime": "Time string in HH:MM format (e.g., '10:30') or null",
  "location": "Physical location or venue (or null)",
  "format": "in-person" or "virtual" or "hybrid" or null,
  "link": "First livestream/registration link found (or null)",
  "poc": {
    "name": "Full name (or null)",
    "email": "Email address (or null)",
    "phone": "Phone number (or null)",
    "rankOrTitle": "Rank or title (e.g., 'Mr.', 'Ms.', 'Dr.', 'CDR') (or null)"
  }
}

Text:
${rawText.substring(0, 3000)}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured training information from NAVSEA workforce communications. Return only valid JSON.',
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

    // Validate and normalize
    return {
      title: parsed.title || null,
      description: parsed.description || null,
      mandatory: parsed.mandatory === true || parsed.mandatory === 'true',
      topic: parsed.topic || null,
      sponsoringOffice: parsed.sponsoringOffice || null,
      trainingDate: parsed.trainingDate || null,
      startTime: parsed.startTime || null,
      endTime: parsed.endTime || null,
      location: parsed.location || null,
      format: ['in-person', 'virtual', 'hybrid'].includes(parsed.format) ? parsed.format : null,
      link: parsed.link || null,
      poc: {
        name: parsed.poc?.name || null,
        email: parsed.poc?.email || null,
        phone: parsed.poc?.phone || null,
        rankOrTitle: parsed.poc?.rankOrTitle || null,
      },
    }
  } catch (error) {
    console.error('TrainingParserService error:', error)
    // Return safe defaults on error
    return {
      title: null,
      description: rawText.substring(0, 500),
      mandatory: false,
      topic: null,
      sponsoringOffice: null,
      trainingDate: null,
      startTime: null,
      endTime: null,
      location: null,
      format: null,
      link: null,
      poc: {
        name: null,
        email: null,
        phone: null,
        rankOrTitle: null,
      },
    }
  }
}

