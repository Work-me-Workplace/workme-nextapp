/**
 * WorkOps Items Service
 * 
 * Database service functions for WorkOpsItem model
 */

import { prisma } from '@/lib/prisma'
import { WorkOpsItemType, WorkOpsUrgency, WorkOpsSource } from '@prisma/client'

export interface CreateWorkOpsItemData {
  outlookId: string
  title: string
  body?: string | null
  itemType: WorkOpsItemType
  urgency?: WorkOpsUrgency | null
  source?: WorkOpsSource | null
  dueDate?: Date | null
  assignedBy?: string | null
}

/**
 * Create a new WorkOpsItem
 */
export async function createWorkOpsItem(data: CreateWorkOpsItemData) {
  console.log('[createWorkOpsItem]', {
    outlookId: data.outlookId,
    title: data.title,
    itemType: data.itemType,
    source: data.source,
  })

  const item = await prisma.workOpsItem.create({
    data: {
      outlookId: data.outlookId,
      title: data.title,
      body: data.body || null,
      itemType: data.itemType,
      urgency: data.urgency || null,
      source: data.source || null,
      dueDate: data.dueDate || null,
      assignedBy: data.assignedBy || null,
    },
  })

  console.log('[createWorkOpsItem] SUCCESS', { itemId: item.id })

  return item
}

/**
 * Get WorkOpsItem by ID
 */
export async function getWorkOpsItem(id: string) {
  const item = await prisma.workOpsItem.findUnique({
    where: { id },
    include: {
      outlook: true,
    },
  })

  if (!item) {
    throw new Error('WorkOpsItem not found')
  }

  return item
}

/**
 * List WorkOpsItems for an outlook
 */
export async function listWorkOpsItems(outlookId: string) {
  const items = await prisma.workOpsItem.findMany({
    where: { outlookId },
    orderBy: { createdAt: 'desc' },
  })

  return items
}

