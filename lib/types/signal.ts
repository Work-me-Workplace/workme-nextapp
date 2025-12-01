/**
 * Signal Type Definitions
 * 
 * This is a separate domain from Universal Ingest and Workforce Ingest.
 * Signals = OSINT domain, not AI parsing domain, not CompanyX domain.
 */

export enum SignalType {
  NOTE_LOOKUP = "note_lookup",
  GOOGLE_SCAN = "google_scan",
  X_FEED = "x_feed",
  SENIOR_EMAIL = "senior_email",
  CLIP_PARSE = "clip_parse",
}

export interface SignalSearchResult {
  title: string
  url: string
  snippet: string
  source?: string
  date?: string
}

export interface NoteLookupRequest {
  signal: string
}

export interface NoteLookupResponse {
  success: true
  public: boolean
  results: SignalSearchResult[]
}

export interface NoteLookupError {
  success: false
  error: string
}

export interface GoogleScanRequest {
  query: string
}

export interface GoogleScanResponse {
  success: true
  results: SignalSearchResult[]
  totalResults?: number
}

export interface GoogleScanError {
  success: false
  error: string
}

