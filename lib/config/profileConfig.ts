/**
 * Profile Configuration
 * 
 * Enum values and options for profile forms
 */

export const jobRoleOptions = [
  { value: 'INDIVIDUAL_CONTRIBUTOR', label: 'Individual Contributor' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DIRECTOR_LEVEL', label: 'Director Level' },
  { value: 'PROJECT_LEAD', label: 'Project Lead' },
] as const

export const salaryRangeOptions = [
  { value: 'BELOW_50K', label: 'Below $50K' },
  { value: 'K50_100K', label: '$50K - $100K' },
  { value: 'K100_150K', label: '$100K - $150K' },
  { value: 'K150_200K', label: '$150K - $200K' },
  { value: 'ABOVE_200K', label: 'Above $200K' },
] as const

export const companyTypeOptions = [
  { value: 'NON_PROFIT', label: 'Non-Profit' },
  { value: 'FOR_PROFIT', label: 'For-Profit' },
  { value: 'PUBLICLY_TRADED', label: 'Publicly Traded' },
  { value: 'GOVERNMENT', label: 'Government' },
] as const

export const revenueRangeOptions = [
  { value: 'UNDER_10M', label: 'Under $10M' },
  { value: 'M10_50', label: '$10M - $50M' },
  { value: 'M50_200', label: '$50M - $200M' },
  { value: 'M200_1000', label: '$200M - $1B' },
  { value: 'ABOVE_1000M', label: 'Above $1B' },
] as const

