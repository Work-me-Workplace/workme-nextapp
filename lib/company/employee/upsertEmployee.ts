/**
 * Company Employee Upsert Service
 * 
 * Upserts a CompanyEmployee record by searching email first, then fullName fallback.
 * Normalizes unitRaw into companyUnitId/divisionId if possible.
 */

'use server'

import { prisma } from '@/lib/prisma'

export interface UpsertEmployeeData {
  fullName: string
  title?: string | null
  email?: string | null
  phone?: string | null
  photoUrl?: string | null
  unitRaw?: string | null // e.g. "SEA 05", "SEA05D1" as imported
  companyId?: string | null
  companyUnitId?: string | null
  divisionId?: string | null
}

/**
 * Normalize unitRaw into companyUnitId or divisionId if possible
 */
async function normalizeUnit(
  unitRaw: string | null | undefined,
  companyId: string | null | undefined
): Promise<{ companyUnitId: string | null; divisionId: string | null }> {
  if (!unitRaw) {
    return { companyUnitId: null, divisionId: null }
  }

  // Try to match against CompanyUnit names
  const companyUnit = await prisma.companyUnit.findFirst({
    where: {
      name: {
        equals: unitRaw,
        mode: 'insensitive',
      },
    },
  })

  if (companyUnit) {
    return { companyUnitId: companyUnit.id, divisionId: null }
  }

  // Try to match against DivisionUnit names
  // DivisionUnit belongs to CompanyUnit, so we need to check if the CompanyUnit's company matches
  // DivisionUnit.company -> CompanyUnit, and CompanyUnit has companyId
  const divisionUnit = await prisma.divisionUnit.findFirst({
    where: {
      name: {
        equals: unitRaw,
        mode: 'insensitive',
      },
      ...(companyId && {
        company: {
          companyId: companyId,
        },
      }),
    },
    select: {
      id: true,
      companyUnitId: true,
    },
  })

  if (divisionUnit) {
    return {
      companyUnitId: divisionUnit.companyUnitId,
      divisionId: divisionUnit.id,
    }
  }

  // No match found - return nulls (unitRaw will be stored separately if needed)
  return { companyUnitId: null, divisionId: null }
}

/**
 * Upsert a CompanyEmployee
 * 
 * Searches by email first, then fullName fallback.
 * Auto-creates if not found.
 * Normalizes unitRaw into companyUnitId/divisionId if possible.
 */
export async function upsertEmployee(data: UpsertEmployeeData) {
  const { fullName, title, email, phone, photoUrl, unitRaw, companyId, companyUnitId, divisionId } = data

  // Normalize unitRaw if provided
  const normalized = await normalizeUnit(unitRaw, companyId)
  const finalCompanyUnitId = companyUnitId || normalized.companyUnitId
  const finalDivisionId = divisionId || normalized.divisionId

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
        companyUnitId: finalCompanyUnitId || employee.companyUnitId,
        divisionId: finalDivisionId || employee.divisionId,
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
        companyUnitId: finalCompanyUnitId,
        divisionId: finalDivisionId,
      },
    })
  }

  return employee
}

