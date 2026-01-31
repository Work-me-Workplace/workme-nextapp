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

export type RegistrationLinkItem = { label?: string; url: string }
export type TimeSlotItem = { date?: string; startTime: string; endTime: string; label?: string }

export interface TrainingModel {
  title: string | null
  description: string | null
  mandatory: boolean
  topic: string | null
  sponsoringOffice: string | null
  trainingDate: string | null // ISO date string - for scheduled training events
  startTime: string | null // "09:00" (legacy; use timeSlots for multiple)
  endTime: string | null // "10:30"
  timeSlots: TimeSlotItem[] | null // Multiple sessions: "9:30-10:30 a.m. ET or 11:00 a.m.-12:00 p.m. ET"
  completionDeadline: string | null // ISO date string - for self-paced training: deadline to complete by
  isSelfPaced: boolean // True if training is self-paced (no fixed schedule)
  registrationDeadline: string | null // ISO date - deadline to register (e.g. "Registration deadline is Feb. 9")
  location: string | null
  format: 'in-person' | 'virtual' | 'hybrid' | null
  link: string | null // First livestream/registration link (legacy single link)
  registrationLinks: RegistrationLinkItem[] | null // Multiple registration links with optional labels
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

IMPORTANT: Distinguish between:
- Scheduled training events: Has a specific date/time when training occurs (use trainingDate, startTime, endTime)
- Self-paced training with deadlines: Training can be completed anytime, but has a completion deadline (use completionDeadline, isSelfPaced: true)
- Look for phrases like "complete by", "must complete by", "deadline", "due by" to identify completion deadlines
- If there's no start/end time mentioned and text mentions "self-paced", "complete by", or similar, it's likely self-paced

Return JSON with these exact fields:
{
  "title": "Training title or name (or null)",
  "description": "Full description (or null)",
  "mandatory": true or false,
  "topic": "Training topic/subject (or null)",
  "sponsoringOffice": "Office or organization sponsoring (or null)",
  "trainingDate": "ISO date string (YYYY-MM-DD) for scheduled training events, or null",
  "startTime": "Time string in HH:MM format (e.g., '09:00') for scheduled events, or null",
  "endTime": "Time string in HH:MM format (e.g., '10:30') for scheduled events, or null",
  "timeSlots": "Array of { date?: string (ISO), startTime: string, endTime: string, label?: string } when training is held at multiple times (e.g. '9:30-10:30 a.m. ET or 11:00 a.m.-12:00 p.m. ET'). Omit date if same as trainingDate. Or null if single time.",
  "completionDeadline": "ISO date string (YYYY-MM-DD) for self-paced training deadlines, or null",
  "isSelfPaced": true if training is self-paced (no fixed schedule), false if scheduled event,
  "registrationDeadline": "ISO date string (YYYY-MM-DD) when registration must be completed by (e.g. 'Registration deadline is Feb. 9'), or null",
  "location": "Physical location or venue (or null)",
  "format": "in-person" or "virtual" or "hybrid" or null,
  "link": "First livestream/registration link found (or null)",
  "registrationLinks": "Array of { label?: string, url: string } for multiple registration links (e.g. civilians/military vs contractors). Use when different groups have different links. Or null if only one link.",
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
    const isSelfPaced = parsed.isSelfPaced === true || parsed.isSelfPaced === 'true'
    
    const registrationLinks = Array.isArray(parsed.registrationLinks)
      ? parsed.registrationLinks.filter((x: any) => x && typeof x.url === 'string').map((x: any) => ({ label: x.label || undefined, url: x.url }))
      : null

    const timeSlots = Array.isArray(parsed.timeSlots)
      ? parsed.timeSlots
          .filter((x: any) => x && typeof x.startTime === 'string' && typeof x.endTime === 'string')
          .map((x: any) => ({
            date: x.date || undefined,
            startTime: String(x.startTime),
            endTime: String(x.endTime),
            label: x.label || undefined,
          }))
      : null

    return {
      title: parsed.title || null,
      description: parsed.description || null,
      mandatory: parsed.mandatory === true || parsed.mandatory === 'true',
      topic: parsed.topic || null,
      sponsoringOffice: parsed.sponsoringOffice || null,
      trainingDate: parsed.trainingDate || null,
      startTime: parsed.startTime || null,
      endTime: parsed.endTime || null,
      timeSlots: timeSlots?.length ? timeSlots : null,
      completionDeadline: parsed.completionDeadline || null,
      isSelfPaced: isSelfPaced,
      registrationDeadline: parsed.registrationDeadline || null,
      location: parsed.location || null,
      format: ['in-person', 'virtual', 'hybrid'].includes(parsed.format) ? parsed.format : null,
      link: parsed.link || null,
      registrationLinks: registrationLinks?.length ? registrationLinks : null,
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
      timeSlots: null,
      completionDeadline: null,
      isSelfPaced: false,
      registrationDeadline: null,
      location: null,
      format: null,
      link: null,
      registrationLinks: null,
      poc: {
        name: null,
        email: null,
        phone: null,
        rankOrTitle: null,
      },
    }
  }
}

