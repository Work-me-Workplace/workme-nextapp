/**
 * CENTRALIZED REDIS SERIALIZATION FOR SECTIONS
 * 
 * ⛔️ MANDATORY: ALL section operations MUST use these functions.
 * NO route is allowed to call redis.get/set directly for sections.
 * 
 * This is the ONLY chokepoint for section data in Redis.
 * All writes go through setSections() → JSON.stringify()
 * All reads go through getSections() → JSON.parse()
 */

import { getRedis } from '@/lib/redis'

const buildKey = (workMeId: string) => `workstuff:sections:${workMeId}`

/**
 * Get sections array from Redis
 * ALWAYS JSON-parsed with safe fallback
 */
export async function getSections(workMeId: string): Promise<any[]> {
  const redis = getRedis()
  const raw = await redis.get(buildKey(workMeId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw as string)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('❌ Redis parse error:', e, 'raw:', raw)
    return []
  }
}

/**
 * Set sections array in Redis
 * ALWAYS JSON-stringified
 * NEVER accepts raw objects
 */
export async function setSections(workMeId: string, sections: any[], ttl: number = 30 * 60): Promise<void> {
  const redis = getRedis()
  // MANDATORY: Always JSON.stringify - never pass raw objects
  await redis.setex(buildKey(workMeId), ttl, JSON.stringify(sections))
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
  const idx = sections.findIndex((s: any) => s.id === sectionId)
  if (idx === -1) return null

  sections[idx] = { ...sections[idx], ...updates }
  await setSections(workMeId, sections)

  return sections[idx]
}

