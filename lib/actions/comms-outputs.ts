'use server'

import { prisma } from '../prisma'
import { z } from 'zod'
import { getWorkMeId } from '../getWorkMeId.server'

const commsOutputSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  wordCount: z.number().int().positive().optional().nullable(),
  dateSent: z.date().optional().nullable(),
  topics: z.any().optional().nullable(), // JSON
})

export async function createCommsOutput(data: z.infer<typeof commsOutputSchema>) {
  try {
    const validated = commsOutputSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const commsOutput = await prisma.commsOutput.create({
      data: {
        ...validated,
        workMeId,
        description: validated.description ?? undefined,
        wordCount: validated.wordCount ?? undefined,
        dateSent: validated.dateSent ?? undefined,
        topics: validated.topics ?? undefined,
      },
    })

    return { success: true, commsOutput }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to create comms output' }
  }
}

export async function updateCommsOutput(id: string, data: z.infer<typeof commsOutputSchema>) {
  try {
    const validated = commsOutputSchema.parse(data)
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.commsOutput.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Comms output not found' }
    }

    const commsOutput = await prisma.commsOutput.update({
      where: { id },
      data: {
        ...validated,
        description: validated.description ?? undefined,
        wordCount: validated.wordCount ?? undefined,
        dateSent: validated.dateSent ?? undefined,
        topics: validated.topics ?? undefined,
      },
    })

    return { success: true, commsOutput }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors }
    }
    return { success: false, error: 'Failed to update comms output' }
  }
}

export async function deleteCommsOutput(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const existing = await prisma.commsOutput.findFirst({
      where: { id, workMeId },
    })

    if (!existing) {
      return { success: false, error: 'Comms output not found' }
    }

    await prisma.commsOutput.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete comms output' }
  }
}

export async function getCommsOutputs() {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated', commsOutputs: [] }
    }

    const commsOutputs = await prisma.commsOutput.findMany({
      where: { workMeId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, commsOutputs }
  } catch (error) {
    return { success: false, error: 'Failed to fetch comms outputs', commsOutputs: [] }
  }
}

export async function getCommsOutput(id: string) {
  try {
    const workMeId = await getWorkMeId()

    if (!workMeId) {
      return { success: false, error: 'Not authenticated' }
    }

    const commsOutput = await prisma.commsOutput.findFirst({
      where: { id, workMeId },
    })

    if (!commsOutput) {
      return { success: false, error: 'Comms output not found' }
    }

    return { success: true, commsOutput }
  } catch (error) {
    return { success: false, error: 'Failed to fetch comms output' }
  }
}
