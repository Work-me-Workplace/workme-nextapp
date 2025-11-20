'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId'

const objectiveSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  howMeasured: z.string().optional().nullable(),
})

export async function createObjective(data: z.infer<typeof objectiveSchema>) {
  try {
    const validated = objectiveSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const objective = await prisma.objective.create({
      data: {
        ...validated,
        workMeId,
        description: validated.description ?? undefined,
        howMeasured: validated.howMeasured ?? undefined,
      },
    })

    return { success: true, objective }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create objective' }
  }
}

export async function updateObjective(id: string, data: z.infer<typeof objectiveSchema>) {
  try {
    const validated = objectiveSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.objective.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Objective not found' }
    }

    const objective = await prisma.objective.update({
      where: { id },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        howMeasured: validated.howMeasured ?? undefined,
      },
    })

    return { success: true, objective }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update objective' }
  }
}

export async function deleteObjective(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.objective.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Objective not found' }
    }

    await prisma.objective.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete objective' }
  }
}

export async function getObjectives() {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated', objectives: [] }
    }

    const objectives = await prisma.objective.findMany({
      where: { workMeId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, objectives }
  } catch (error) {
    return { success: false, error: 'Failed to fetch objectives', objectives: [] }
  }
}

export async function getObjective(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const objective = await prisma.objective.findFirst({
      where: { id, workMeId },
    })

    if (!objective) {
      return { success: false, error: 'Objective not found' }
    }

    return { success: true, objective }
  } catch (error) {
    return { success: false, error: 'Failed to fetch objective' }
  }
}
