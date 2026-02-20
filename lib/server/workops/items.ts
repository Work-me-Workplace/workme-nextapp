/**
 * WorkOps Items Service
 * 
 * Database service functions for WorkOpsItem model
 */

import { prisma } from '@/lib/prisma'
import { WorkOpsItemType, WorkOpsUrgency, WorkOpsSource, WorkOpsDerivedFrom } from '@prisma/client'

export interface CreateWorkOpsItemData {
  outlookId: string
  title: string
  body?: string | null
  itemType: WorkOpsItemType
  urgency?: WorkOpsUrgency | null
  source?: WorkOpsSource | null
  derivedFrom?: WorkOpsDerivedFrom | null
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
      derivedFrom: data.derivedFrom || null,
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

/**
 * Update a WorkOpsItem
 */
export async function updateWorkOpsItem(id: string, data: Partial<{
  title: string
  body: string | null
  itemType: WorkOpsItemType
  urgency: WorkOpsUrgency | null
  status: any // WorkOpsStatus
  source: WorkOpsSource | null
  priority: number | null
  dueDate: Date | null
  assignedBy: string | null
  // Whiteboard fields (will be added to schema)
  positionX: number | null
  positionY: number | null
  groupId: string | null
  targetQuarter: string | null
}>) {
  console.log('[updateWorkOpsItem]', { id, updates: Object.keys(data) })

  // Filter out undefined values
  const updateData: any = {}
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value
    }
  })

  const item = await prisma.workOpsItem.update({
    where: { id },
    data: updateData,
  })

  console.log('[updateWorkOpsItem] SUCCESS', { itemId: item.id })

  return item
}

/**
 * Delete a WorkOpsItem (and its daily assignments via cascade)
 */
export async function deleteWorkOpsItem(id: string) {
  console.log('[deleteWorkOpsItem]', { id })

  const item = await prisma.workOpsItem.findUnique({
    where: { id },
    include: { outlook: true },
  })

  if (!item) {
    throw new Error('WorkOpsItem not found')
  }

  await prisma.workOpsItem.delete({
    where: { id },
  })

  console.log('[deleteWorkOpsItem] SUCCESS', { id })
  return { id }
}

