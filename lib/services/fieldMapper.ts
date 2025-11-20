/**
 * Field Mapper Service
 * 
 * Maps form data to database fields with validation and type conversion
 */

import { JobRole, SalaryRange, CompanyType, RevenueRange } from '@prisma/client'

export interface WorkMeProfileData {
  jobTitle?: string
  specialty?: string
  industry?: string
  jobRole?: string | JobRole
  annualSalary?: string
  salaryRange?: string | SalaryRange
  workLocation?: string
  city?: string
  state?: string
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
   */
  static mapWorkMeProfile(data: WorkMeProfileData): {
    jobTitle?: string
    specialty?: string
    industry?: string
    jobRole?: JobRole
    annualSalary?: string
    salaryRange?: SalaryRange
    workLocation?: string
    city?: string
    state?: string
  } {
    return {
      jobTitle: data.jobTitle?.trim() || undefined,
      specialty: data.specialty?.trim() || undefined,
      industry: data.industry?.trim() || undefined,
      jobRole: data.jobRole ? (data.jobRole as JobRole) : undefined,
      annualSalary: data.annualSalary?.trim() || undefined,
      salaryRange: data.salaryRange ? (data.salaryRange as SalaryRange) : undefined,
      workLocation: data.workLocation?.trim() || undefined,
      city: data.city?.trim() || undefined,
      state: data.state?.trim() || undefined,
    }
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
   */
  static isValidJobRole(value: string): value is JobRole {
    return ['INDIVIDUAL_CONTRIBUTOR', 'MANAGER', 'DIRECTOR_LEVEL', 'PROJECT_LEAD'].includes(value)
  }

  /**
   * Validate SalaryRange enum value
   */
  static isValidSalaryRange(value: string): value is SalaryRange {
    return ['BELOW_50K', 'K50_100K', 'K100_150K', 'K150_200K', 'ABOVE_200K'].includes(value)
  }

  /**
   * Validate CompanyType enum value
   */
  static isValidCompanyType(value: string): value is CompanyType {
    return ['NON_PROFIT', 'FOR_PROFIT', 'PUBLICLY_TRADED', 'GOVERNMENT'].includes(value)
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

