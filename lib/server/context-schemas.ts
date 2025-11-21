"use server"

import { z } from "zod"

// Campaign Schema
export const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  windowStart: z.date().optional().nullable(),
  windowEnd: z.date().optional().nullable(),
  ctaLink: z.string().url().optional().nullable(),
  sponsor: z.string().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Impact Event Schema
export const impactEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  effectiveDate: z.date().optional().nullable(),
  impactedPopulation: z.string().optional().nullable(),
  urgency: z.string().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Training Schema
export const trainingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  trainingDate: z.date().optional().nullable(),
  deadline: z.date().optional().nullable(),
  link: z.string().url().optional().nullable(),
  mandatory: z.boolean().default(false),
  sponsoringOffice: z.string().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Event Schema
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  eventCategory: z.string().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Community Opportunity Schema
export const communityOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  partnerOrg: z.string().optional().nullable(),
  date: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  signUpLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
})

// Benefits Schema
export const benefitsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  windowStart: z.date().optional().nullable(),
  windowEnd: z.date().optional().nullable(),
  fehbLink: z.string().url().optional().nullable(),
  fedvipLink: z.string().url().optional().nullable(),
  fsafedsLink: z.string().url().optional().nullable(),
  faqLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
  pocDepartment: z.string().optional().nullable(),
  annualRecurrence: z.boolean().default(false),
})

// Career Schema
export const careerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  deadlines: z.array(z.object({
    label: z.string(),
    date: z.date(),
  })).optional().nullable(),
  supervisorName: z.string().optional().nullable(),
  resourceLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
  pocDepartment: z.string().optional().nullable(),
})

// Employee Cause Schema
export const employeeCauseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  partnerOrg: z.string().optional().nullable(),
  windowStart: z.date().optional().nullable(),
  windowEnd: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  neededItems: z.array(z.string()).default([]),
  collectionPoints: z.array(z.string()).default([]),
  signUpLink: z.string().url().optional().nullable(),
  pocFirstName: z.string().optional().nullable(),
  pocLastName: z.string().optional().nullable(),
  pocEmail: z.string().email().optional().nullable(),
  pocPhone: z.string().optional().nullable(),
  sponsoringDepartment: z.string().optional().nullable(),
})

// Schema map for validation
export const SCHEMA_MAP = {
  campaign: campaignSchema,
  impact_event: impactEventSchema,
  training: trainingSchema,
  event: eventSchema,
  community: communityOpportunitySchema,
  benefits: benefitsSchema,
  career: careerSchema,
  employee_cause: employeeCauseSchema,
} as const

