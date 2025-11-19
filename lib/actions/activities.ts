'use server'

import { prisma } from '../prisma'
import { z } from 'zod'

const getUserId = (): string => {
  return 'user-1' // Placeholder - replace with actual auth
}

const activitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
})

export async function createOrganizationalActivity(data: z.infer<typeof activitySchema>) {
  try {
    const validated = activitySchema.parse(data)
    const userId = getUserId()

    const activity = await prisma.organizationalActivity.create({
      data: {
        ...validated,
        userId,
        description: validated.description ?? undefined,
        startDate: validated.startDate ?? undefined,
        endDate: validated.endDate ?? undefined,
      },
    })

    return { success: true, activity }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create organizational activity' }
  }
}

export async function updateOrganizationalActivity(id: string, data: z.infer<typeof activitySchema>) {
  try {
    const validated = activitySchema.parse(data)
    const userId = getUserId()

    const existing = await prisma.organizationalActivity.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return { success: false, error: 'Organizational activity not found' }
    }

    const activity = await prisma.organizationalActivity.update({
      where: { id },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        startDate: validated.startDate ?? undefined,
        endDate: validated.endDate ?? undefined,
      },
    })

    return { success: true, activity }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update organizational activity' }
  }
}

export async function deleteOrganizationalActivity(id: string) {
  try {
    const userId = getUserId()

    const existing = await prisma.organizationalActivity.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return { success: false, error: 'Organizational activity not found' }
    }

    await prisma.organizationalActivity.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete organizational activity' }
  }
}

export async function getOrganizationalActivities() {
  try {
    const userId = getUserId()

    const activities = await prisma.organizationalActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, activities }
  } catch (error) {
    return { success: false, error: 'Failed to fetch organizational activities', activities: [] }
  }
}

export async function getOrganizationalActivity(id: string) {
  try {
    const userId = getUserId()

    const activity = await prisma.organizationalActivity.findFirst({
      where: { id, userId },
    })

    if (!activity) {
      return { success: false, error: 'Organizational activity not found' }
    }

    return { success: true, activity }
  } catch (error) {
    return { success: false, error: 'Failed to fetch organizational activity' }
  }
}

