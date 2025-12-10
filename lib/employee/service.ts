/**
 * Employee Service
 * 
 * Simple service for searching and creating employees
 */

'use server'

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/server/verifyAuth'
import { getWorkMeCompanyId } from '@/lib/config/workmeConfig'

export interface CreateEmployeeData {
  fullName: string
  firstName?: string | null
  lastName?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  photoUrl?: string | null
  companyUnit?: string | null
  division?: string | null
}

export interface EmployeeSearchResult {
  id: string
  fullName: string
  title: string | null
  email: string | null
  companyUnit: string | null
}

/**
 * Search for employees by name (case-insensitive)
 */
export async function searchEmployees(query: string, companyId: string): Promise<EmployeeSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const employees = await prisma.companyEmployee.findMany({
    where: {
      companyId,
      fullName: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      fullName: true,
      title: true,
      email: true,
      companyUnit: true,
    },
    take: 20,
  })

  return employees
}

/**
 * Create a new employee
 * Simple: just name and companyId required
 */
export async function createEmployee(data: CreateEmployeeData) {
  // Get authenticated user context
  const { firebaseId } = await verifyAuth()
  const workMe = await prisma.workMe.findUnique({
    where: { firebaseId },
    select: {
      id: true,
      companyId: true,
      workMeCompanyId: true,
    },
  })

  if (!workMe) {
    throw new Error('WorkMe identity not found. Please complete sign up.')
  }

  if (!workMe.companyId) {
    throw new Error('User must belong to a company before creating employees')
  }

  // Build fullName from firstName/lastName if provided
  const fullName = data.fullName || 
    (data.firstName && data.lastName 
      ? `${data.firstName} ${data.lastName}`.trim()
      : data.firstName || data.lastName || '')

  if (!fullName || fullName.trim().length === 0) {
    throw new Error('fullName is required')
  }

  // Ensure workMeCompanyId is set (get it if WorkMe doesn't have it)
  const workMeCompanyId = workMe.workMeCompanyId || await getWorkMeCompanyId()
  
  // If WorkMe doesn't have workMeCompanyId, backfill it
  if (!workMe.workMeCompanyId) {
    await prisma.workMe.update({
      where: { id: workMe.id },
      data: { workMeCompanyId },
    })
  }

  const employee = await prisma.companyEmployee.create({
    data: {
      fullName,
      title: data.title || null,
      email: data.email || null,
      phone: data.phone || null,
      photoUrl: data.photoUrl || null,
      companyId: workMe.companyId,
      workMeCompanyId, // Silent background tag for tenant partitioning
      createdByWorkMeId: workMe.id,
      companyUnit: data.companyUnit || null,
      division: data.division || null,
    },
  })

  return employee
}
