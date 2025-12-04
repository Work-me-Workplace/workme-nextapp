/**
 * Field Mapper Service
 * 
 * Maps form data to database fields with validation and type conversion
 */

import { CompanyType, RevenueRange } from '@prisma/client'

// NOTE: JobRole and SalaryRange enums removed - employment data now in WorkEntry
// WorkMeProfileData is deprecated - use WorkProfile for personal identity only
export interface WorkMeProfileData {
  // Deprecated - employment data belongs in WorkEntry
  // Keeping for backward compatibility during migration
}

export interface CompanyData {
  name: string
  industry?: string
  website?: string
  city?: string
  state?: string
  description?: string
  headcount?: number | string
  companyType?: string | CompanyType
  revenueRange?: string | RevenueRange
}

export class FieldMapperService {
  /**
   * Map WorkMe profile form data to database fields
   * ⚠️ DEPRECATED: Employment data now belongs in WorkEntry
   * Keeping for backward compatibility during migration
   */
  static mapWorkMeProfile(data: WorkMeProfileData): Record<string, never> {
    // Deprecated - employment data should be stored in WorkEntry
    return {}
  }

  /**
   * Map company form data to database fields
   */
  static mapCompanyData(data: CompanyData): {
    name: string
    industry?: string
    website?: string
    city?: string
    state?: string
    description?: string
    headcount?: number
    companyType?: CompanyType
    revenueRange?: RevenueRange
  } {
    return {
      name: data.name.trim(),
      industry: data.industry?.trim() || undefined,
      website: data.website?.trim() || undefined,
      city: data.city?.trim() || undefined,
      state: data.state?.trim() || undefined,
      description: data.description?.trim() || undefined,
      headcount: data.headcount ? (typeof data.headcount === 'string' ? parseInt(data.headcount) : data.headcount) : undefined,
      companyType: data.companyType ? (data.companyType as CompanyType) : undefined,
      revenueRange: data.revenueRange ? (data.revenueRange as RevenueRange) : undefined,
    }
  }

  /**
   * Validate JobRole enum value
   * ⚠️ DEPRECATED: JobRole enum removed - employment data now in WorkEntry
   */
  static isValidJobRole(value: string): boolean {
    // Deprecated - enum removed
    return false
  }

  /**
   * Validate SalaryRange enum value
   * ⚠️ DEPRECATED: SalaryRange enum removed - employment data now in WorkEntry
   */
  static isValidSalaryRange(value: string): boolean {
    // Deprecated - enum removed
    return false
  }

  /**
   * Validate CompanyType enum value
   */
  static isValidCompanyType(value: string): value is CompanyType {
    return ['NON_PROFIT', 'GOVERNMENT', 'PRIVATELY_HELD_FIRM', 'SMALL_BUSINESS', 'STARTUP', 'PUBLICLY_TRADED'].includes(value)
  }

  /**
   * Validate RevenueRange enum value
   */
  static isValidRevenueRange(value: string): value is RevenueRange {
    return ['UNDER_10M', 'M10_50', 'M50_200', 'M200_1000', 'ABOVE_1000M'].includes(value)
  }

  /**
   * Clean and normalize string fields (trim, handle empty strings)
   */
  static cleanString(value: string | null | undefined): string | undefined {
    if (!value) return undefined
    const cleaned = value.trim()
    return cleaned.length > 0 ? cleaned : undefined
  }

  /**
   * Parse integer from string or number
   */
  static parseInteger(value: string | number | null | undefined): number | undefined {
    if (value === null || value === undefined) return undefined
    if (typeof value === 'number') return isNaN(value) ? undefined : value
    const parsed = parseInt(String(value))
    return isNaN(parsed) ? undefined : parsed
  }
}

