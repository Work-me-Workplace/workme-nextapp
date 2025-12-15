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

// ============================================
// External Evidence Types
// ============================================

export interface EvidenceAttachmentRequest {
  evidence: Array<{
    title: string
    url: string
    snippet?: string
    source?: string
    date?: string
  }>
  productFamilyId?: string
  productFamilyName?: string
  productFamilyDescription?: string
  productPlatformId?: string
  companyId?: string
  classifications?: Array<{
    type: 'COMPANY_PRODUCTS' | 'COMPANY_PUBLIC_PERCEPTION' | 'EXTERNAL_COMPANY_PRESSURE'
    confirmed: boolean
  }>
}

export interface EvidenceAttachmentResponse {
  success: true
  productFamilyId: string
  evidenceIds: string[]
  message: string
}

export interface EvidenceAttachmentError {
  success: false
  error: string
}

export interface ProductFamilyOption {
  id: string
  name: string
  description?: string
  status: string
  companyId?: string
}

export interface ProductPlatformOption {
  id: string
  name: string
  category?: string
}

