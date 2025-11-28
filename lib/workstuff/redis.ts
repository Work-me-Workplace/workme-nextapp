/**
 * Centralized Redis Serialization for Workforce Stuff Sections
 * 
 * MANDATORY: All section operations MUST use these functions.
 * NEVER use redis.get/set directly for sections.
 * ALWAYS JSON.stringify/parse through these functions.
 */

import { getRedis } from '@/lib/redis'

const keyFor = (workMeId: string) => `workstuff:sections:${workMeId}`

/**
 * Get sections array from Redis
 * ALWAYS JSON-parsed with safe fallback
 */
export async function getSections(workMeId: string): Promise<any[]> {
  const redis = getRedis()
  const raw = await redis.get(keyFor(workMeId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw as string)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('❌ Redis parse error:', e)
    return []
  }
}

/**
 * Set sections array in Redis
 * ALWAYS JSON-stringified
 */
export async function setSections(workMeId: string, sections: any[], ttl: number = 30 * 60): Promise<void> {
  const redis = getRedis()
  await redis.setex(keyFor(workMeId), ttl, JSON.stringify(sections))
}

/**
 * Update a single section in the sections array
 * Uses getSections() and setSections() - never direct Redis calls
 */
export async function updateSection(
  workMeId: string,
  sectionId: string,
  updates: { type?: string; status?: 'pending' | 'mapped' | 'hydrated' }
): Promise<any | null> {
  const sections = await getSections(workMeId)
  const idx = sections.findIndex((s) => s.id === sectionId)
  if (idx === -1) return null

  sections[idx] = { ...sections[idx], ...updates }
  await setSections(workMeId, sections)

  return sections[idx]
}

