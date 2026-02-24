/**
 * Leader Engagement Mapper Service
 * 
 * Pure function that extracts structured leader engagement data from raw text.
 * No DB writes, no side effects - just parsing.
 */

import OpenAI from 'openai'
import { EventAudience } from '@prisma/client'
import { fixDate, getCurrentYear } from './date-fix-utility'

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface LeaderEngagementModel {
  title: string | null
  description: string | null
  engagementDate: string | null // ISO date string
  startTime: string | null // "09:00"
  endTime: string | null // "10:30"
  location: string | null
  topicAreas: string[] | null // Topics that will be covered
  potentialQuestions: string[] | null // Anticipated questions
  keyMessages: string[] | null // Key messages the leader wants to convey
  talkingPoints: string | null // Detailed talking points or script
  leaderName: string | null
  leaderTitle: string | null
  leaderId: string | null // Optional - not extracted from text, may be set separately
  audience: EventAudience | null
  registrationRequired: string | null
  registrationLink: string | null
  format: string | null // "Town Hall", "All-Hands", "Leadership Briefing", etc.
  qAndAEnabled: boolean | null
  pocEmail: string | null
  pocPhone: string | null
}

/**
 * Parse leader engagement data from raw text
 * Pure function - no side effects
 */
export async function parseLeaderEngagement(rawText: string): Promise<LeaderEngagementModel> {
  const openai = getOpenAI()
  const currentYear = getCurrentYear()

  const systemPrompt = `You convert messy government or corporate leader engagement announcements (town halls, all-hands, state of the org) into structured JSON. Return ONLY JSON with the exact structure below.

Extract:

1. Core details — title, description, date, times, location
2. Leader information — leaderName, leaderTitle
3. Topic areas — array of topics that will be covered (e.g., "State of the Org", "Q4 Results", "Strategic Priorities")
4. Potential questions — array of anticipated questions from the audience
5. Key messages — array of key messages the leader wants to convey
6. Talking points — detailed talking points or script (if provided)
7. Audience — must be exactly one of: ALL_WORKFORCE, LEADERS, WORKFORCE_AND_FAMILIES, COMMUNITY
8. Format — "Town Hall", "All-Hands", "Leadership Briefing", etc.
9. Q&A — whether Q&A is enabled (boolean)
10. Registration — registrationRequired, registrationLink
11. Contact — pocEmail, pocPhone

NEVER return IDs.

Return only:

{
  "title": "",
  "description": "",
  "engagementDate": "ISO date string (YYYY-MM-DD). IMPORTANT: If date has no year (e.g., 'Feb. 25'), use current year (${currentYear}). If date is in the past relative to today, assume it's next occurrence. Or null",
  "startTime": "",
  "endTime": "",
  "location": "",
  "topicAreas": [],
  "potentialQuestions": [],
  "keyMessages": [],
  "talkingPoints": "",
  "leaderName": "",
  "leaderTitle": "",
  "audience": "ALL_WORKFORCE" | "LEADERS" | "WORKFORCE_AND_FAMILIES" | "COMMUNITY",
  "registrationRequired": "",
  "registrationLink": "",
  "format": "",
  "qAndAEnabled": false,
  "pocEmail": "",
  "pocPhone": ""
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Parse this leader engagement announcement:\n\n${rawText}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(response.choices[0].message.content || '{}')

    // Normalize and validate
    return {
      title: parsed.title || null,
      description: parsed.description || null,
      engagementDate: fixDate(parsed.engagementDate),
      startTime: parsed.startTime || null,
      endTime: parsed.endTime || null,
      location: parsed.location || null,
      topicAreas: Array.isArray(parsed.topicAreas) ? parsed.topicAreas : null,
      potentialQuestions: Array.isArray(parsed.potentialQuestions) ? parsed.potentialQuestions : null,
      keyMessages: Array.isArray(parsed.keyMessages) ? parsed.keyMessages : null,
      talkingPoints: parsed.talkingPoints || null,
      leaderName: parsed.leaderName || null,
      leaderTitle: parsed.leaderTitle || null,
      leaderId: parsed.leaderId || null, // Optional - typically not in text, may be set separately
      audience: parsed.audience || null,
      registrationRequired: parsed.registrationRequired || null,
      registrationLink: parsed.registrationLink || null,
      format: parsed.format || null,
      qAndAEnabled: parsed.qAndAEnabled ?? null,
      pocEmail: parsed.pocEmail || null,
      pocPhone: parsed.pocPhone || null,
    }
  } catch (error) {
    console.error('[parseLeaderEngagement] Error:', error)
    // Return safe defaults
    return {
      title: null,
      description: null,
      engagementDate: null,
      startTime: null,
      endTime: null,
      location: null,
      topicAreas: null,
      potentialQuestions: null,
      keyMessages: null,
      talkingPoints: null,
      leaderName: null,
      leaderTitle: null,
      leaderId: null,
      audience: null,
      registrationRequired: null,
      registrationLink: null,
      format: null,
      qAndAEnabled: null,
      pocEmail: null,
      pocPhone: null,
    }
  }
}

