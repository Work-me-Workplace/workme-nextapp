/**
 * Highlight Type - UI/UX Enum Only
 * 
 * Used for UI display and filtering, not stored in database
 */
export type HighlightType = 'COMPANY' | 'COMPANY_UNIT' | 'DIVISION'

export const HIGHLIGHT_TYPES: { value: HighlightType; label: string }[] = [
  { value: 'COMPANY', label: 'Company' },
  { value: 'COMPANY_UNIT', label: 'Company Unit' },
  { value: 'DIVISION', label: 'Division' },
]

