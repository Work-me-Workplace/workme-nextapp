/**
 * Company Employee Upsert Service (MVP1 Architecture)
 * 
 * Upserts a CompanyEmployee record by searching email first, then fullName fallback.
 * Uses simple string fields for companyUnit and division - no normalization or lookups.
 */

'use server'

import { prisma } from '@/lib/prisma'

export interface UpsertEmployeeData {
  fullName: string
  title?: string | null
  email?: string | null
  phone?: string | null
  photoUrl?: string | null
  companyId?: string | null
  companyUnit?: string | null  // Optional string label ("SEA 05", "NAVSEA HQ")
  division?: string | null     // Optional string label
}

/**
 * Upsert a CompanyEmployee
 * 
 * Searches by email first, then fullName fallback.
 * Auto-creates if not found.
 * Uses simple string fields - NO unit/division lookups or normalization.
 */
export async function upsertEmployee(data: UpsertEmployeeData) {
  const { fullName, title, email, phone, photoUrl, companyId, companyUnit, division } = data

  // Search by email first
  let employee = null
  if (email) {
    employee = await prisma.companyEmployee.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    })
  }

  // Fallback to fullName search
  if (!employee && fullName) {
    employee = await prisma.companyEmployee.findFirst({
      where: {
        fullName: {
          equals: fullName,
          mode: 'insensitive',
        },
      },
    })
  }

  // Upsert
  if (employee) {
    // Update existing
    employee = await prisma.companyEmployee.update({
      where: { id: employee.id },
      data: {
        fullName,
        title: title || employee.title,
        email: email || employee.email,
        phone: phone || employee.phone,
        photoUrl: photoUrl || employee.photoUrl,
        companyId: companyId || employee.companyId,
        companyUnit: companyUnit !== undefined ? companyUnit : employee.companyUnit,
        division: division !== undefined ? division : employee.division,
      },
    })
  } else {
    // Create new
    if (!companyId) {
      throw new Error('companyId is required when creating a new employee')
    }

    employee = await prisma.companyEmployee.create({
      data: {
        fullName,
        title: title || null,
        email: email || null,
        phone: phone || null,
        photoUrl: photoUrl || null,
        companyId,
        companyUnit: companyUnit || null,
        division: division || null,
      },
    })
  }

  return employee
}

