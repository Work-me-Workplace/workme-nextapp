/**
 * NTK (Need to Know) Types
 * 
 * Shared types for NTK functionality
 * Safe to import in both client and server components
 */

/**
 * NTK Structure
 * NAVSEA-style format for Need-to-Know communications
 */
export interface NTKStructure {
  header: string // [TITLE IN ALL CAPS] – [MONTH] [DAY] format
  poc: string // POC in markdown italics format: *POC: name & email*
  summary: string // 2-4 sentence summary in NAVSEA tone
  title: string // Original title (for compatibility)
  keyPoints?: string[] // Optional: 3-7 bullet points
  actionItems?: string[] // Optional: What readers need to do
  deadline?: string // Optional deadline
  contactInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  relatedLinks?: string[] // URLs or references
  tags?: string[] // Keywords for categorization
}

