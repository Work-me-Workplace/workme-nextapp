/**
 * TypeScript types for Event AI Ingestion
 */

export interface EventIngestionRequest {
  rawText: string
  userContext?: string // Free text for human notes/instructions
}

export interface ParsedEventItem {
  title: string
  description: string | null
  metadata: Record<string, any> | null
}

export interface ParsedWorkEvent {
  title: string
  theme: string | null
  description: string | null
  
  eventDate: string | null           // "2025-12-17"
  startTime: string | null           // "11:30 a.m."
  endTime: string | null              // "1:30 p.m."
  
  eventCategory: string | null
  
  registrationRequired: string | null // "Yes" or "No"
  registrationLink: string | null
  
  speakers: string[]
  
  foodProvided: string | null         // "Yes" or "No"
  foodTypes: string | null
  
  audience: string | null
  vibe: string | null
  perks: string[]
  participation: string[]
}

export interface EventIngestionResponse {
  event: ParsedWorkEvent
  items: ParsedEventItem[]
}

export interface EventIngestionAPIResponse {
  success: true
  data: EventIngestionResponse
}

export interface EventIngestionAPIError {
  success: false
  error: string
}

