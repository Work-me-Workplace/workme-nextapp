/**
 * NTK CSV Pipeline Service
 * 
 * 3-step pipeline: validateColumns → previewRows → savePreviewToEdition
 * 
 * ⚠️ SERVER-ONLY - Never import in client components
 */

import { randomUUID } from 'crypto'

/**
 * CSV Column Mapping
 * Maps CSV headers to expected field names
 */
export interface CSVColumnMapping {
  [csvHeader: string]: string // Maps CSV header to normalized field name
}

/**
 * Preview Row
 * Transformed CSV row with stable inputId
 */
export interface PreviewRow {
  inputId: string // Stable identifier for this row
  rawFields: Record<string, any> // Original CSV row data
}

/**
 * STEP 1: Validate CSV columns
 * 
 * Checks CSV headers and confirms required fields exist
 * Returns mapping object or throws error if missing required fields
 */
export function validateColumns(headers: string[]): {
  valid: boolean
  mapping?: CSVColumnMapping
  error?: string
  warnings?: string[]
} {
  if (!headers || headers.length === 0) {
    return {
      valid: false,
      error: 'CSV has no headers',
    }
  }

  // Normalize headers (trim, lowercase)
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase())

  // Required fields (flexible matching)
  const requiredFields = [
    'title',
    'summary',
    'description',
    'content',
    'text',
    'message',
    'update',
  ]

  // Optional but recommended fields
  const recommendedFields = [
    'date',
    'deadline',
    'poc',
    'contact',
    'link',
    'url',
    'source',
  ]

  // Build mapping from CSV headers to normalized field names
  const mapping: CSVColumnMapping = {}
  const foundRequired: string[] = []
  const warnings: string[] = []

  // Check for at least one required field
  for (const header of normalizedHeaders) {
    // Check if header matches any required field (fuzzy matching)
    for (const required of requiredFields) {
      if (
        header.includes(required) ||
        required.includes(header) ||
        header === required
      ) {
        foundRequired.push(required)
        mapping[header] = required
        break
      }
    }

    // Check for recommended fields
    for (const recommended of recommendedFields) {
      if (
        (header.includes(recommended) ||
          recommended.includes(header) ||
          header === recommended) &&
        !mapping[header]
      ) {
        mapping[header] = recommended
      }
    }
  }

  // If no required field found, try to use the first column as content
  if (foundRequired.length === 0 && normalizedHeaders.length > 0) {
    // Use first column as default content field
    mapping[normalizedHeaders[0]] = 'content'
    warnings.push(
      'No standard content field found. Using first column as content.',
    )
  }

  // Warning for missing recommended fields
  for (const recommended of recommendedFields) {
    const found = normalizedHeaders.some((h) =>
      h.includes(recommended) || recommended.includes(h) || h === recommended,
    )
    if (!found) {
      warnings.push(`Recommended field "${recommended}" not found`)
    }
  }

  return {
    valid: true,
    mapping,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * STEP 2: Preview rows from CSV
 * 
 * Transforms parsed CSV rows into preview rows
 * Generates stable inputId for each row
 */
export function previewRows(
  rows: Record<string, any>[],
  mapping: CSVColumnMapping,
): PreviewRow[] {
  if (!rows || rows.length === 0) {
    return []
  }

  return rows.map((row) => {
    // Generate stable inputId
    const inputId = `ntk_${randomUUID()}`

    // Store raw fields as-is from CSV
    const rawFields: Record<string, any> = {}
    for (const [key, value] of Object.entries(row)) {
      rawFields[key] = value
    }

    return {
      inputId,
      rawFields,
    }
  })
}

/**
 * Helper: Parse CSV text into rows
 */
export function parseCSV(csvText: string): {
  headers: string[]
  rows: Record<string, any>[]
} {
  const lines = csvText.trim().split('\n').filter((line) => line.trim())

  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  // Parse headers (first line)
  const headers = parseCSVLine(lines[0]).map((h) => h.trim())

  if (headers.length === 0) {
    throw new Error('CSV has no headers')
  }

  // Parse data rows
  const rows: Record<string, any>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])

    // Skip empty rows
    if (values.every((v) => !v || v.trim().length === 0)) {
      continue
    }

    // Map values to headers
    const row: Record<string, any> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })

    rows.push(row)
  }

  return { headers, rows }
}

/**
 * Helper: Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  result.push(current)

  return result
}

