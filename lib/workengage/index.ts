/**
 * WorkEngage - Engagement Messaging Module
 * 
 * Simple service: pick employee, write message, send
 */

import { prisma } from '@/lib/prisma'

export interface CreateEngageMessageData {
  message: string
  employeeId?: string | null
  highlightId?: string | null
}

/**
 * Create a new engagement message
 */
export async function createMessage(
  data: CreateEngageMessageData,
  ownerId: string
) {
  if (!ownerId) {
    throw new Error('ownerId is required')
  }

  if (!data.message || data.message.trim().length === 0) {
    throw new Error('message is required')
  }

  return await prisma.engageMessage.create({
    data: {
      message: data.message,
      highlightId: data.highlightId || null,
      ownerId,
    },
  })
}

/**
 * Get engagement message history for an owner
 */
export async function getHistory(ownerId: string) {
  if (!ownerId) {
    throw new Error('ownerId is required')
  }

  return await prisma.engageMessage.findMany({
    where: { ownerId },
    include: {
      highlight: {
        include: {
          employees: {
            include: {
              employee: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
