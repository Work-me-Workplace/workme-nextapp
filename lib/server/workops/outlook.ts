/**
 * WorkOps Outlook Service
 * 
 * Database service functions for WorkOpsOutlook model
 */

import { prisma } from '@/lib/prisma'

/**
 * Get or create WorkOpsOutlook for a user
 */
export async function getOrCreateOutlook(workMeId: string) {
  let outlook = await prisma.workOpsOutlook.findUnique({
    where: { workMeId },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!outlook) {
    outlook = await prisma.workOpsOutlook.create({
      data: { workMeId },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  return outlook
}

/**
 * Get WorkOpsOutlook by workMeId
 */
export async function getOutlook(workMeId: string) {
  const outlook = await prisma.workOpsOutlook.findUnique({
    where: { workMeId },
    include: {
      items: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return outlook
}

