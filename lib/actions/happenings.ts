'use server'

import { prisma } from '../prisma'
import { z } from 'zod'

const getUserId = (): string => {
  return 'user-1' // Placeholder - replace with actual auth
}

const happeningSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.date().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function createHappening(data: z.infer<typeof happeningSchema>) {
  try {
    const validated = happeningSchema.parse(data)
    const userId = getUserId()

    const happening = await prisma.companyHappening.create({
      data: {
        ...validated,
        userId,
        date: validated.date ?? undefined,
        description: validated.description ?? undefined,
      },
    })

    return { success: true, happening }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create happening' }
  }
}

export async function updateHappening(id: string, data: z.infer<typeof happeningSchema>) {
  try {
    const validated = happeningSchema.parse(data)
    const userId = getUserId()

    const existing = await prisma.companyHappening.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return { success: false, error: 'Happening not found' }
    }

    const happening = await prisma.companyHappening.update({
      where: { id },
      data: {
        ...validated,
        date: validated.date ?? undefined,
        description: validated.description ?? undefined,
      },
    })

    return { success: true, happening }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update happening' }
  }
}

export async function deleteHappening(id: string) {
  try {
    const userId = getUserId()

    const existing = await prisma.companyHappening.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return { success: false, error: 'Happening not found' }
    }

    await prisma.companyHappening.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete happening' }
  }
}

export async function getHappenings() {
  try {
    const userId = getUserId()

    const happenings = await prisma.companyHappening.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, happenings }
  } catch (error) {
    return { success: false, error: 'Failed to fetch happenings', happenings: [] }
  }
}

export async function getHappening(id: string) {
  try {
    const userId = getUserId()

    const happening = await prisma.companyHappening.findFirst({
      where: { id, userId },
    })

    if (!happening) {
      return { success: false, error: 'Happening not found' }
    }

    return { success: true, happening }
  } catch (error) {
    return { success: false, error: 'Failed to fetch happening' }
  }
}
