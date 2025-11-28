/**
 * Redis Helper for Workforce Stuff Ingestion Pipeline
 * Uses Upstash Redis REST API for temp workspace storage
 */

import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (redis) {
    return redis
  }

  // Use Upstash Redis REST API
  // Automatically reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
  try {
    redis = Redis.fromEnv()
    console.log('✅ Upstash Redis client initialized')
    return redis
  } catch (error: any) {
    // Fallback to manual initialization if fromEnv() fails
    let url = process.env.UPSTASH_REDIS_REST_URL
    let token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        'Upstash Redis configuration is missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.\n\n' +
        'Note: These should be REST API credentials, not Redis CLI connection strings.\n' +
        'Get them from: https://console.upstash.com/redis -> Your Database -> REST API'
      )
    }

    // Strip quotes from URL and token
    url = url.trim().replace(/^["']+|["']+$/g, '')
    token = token.trim().replace(/^["']+|["']+$/g, '')

    // Validate URL format
    if (!url.startsWith('https://')) {
      throw new Error(
        `Invalid UPSTASH_REDIS_REST_URL format. Expected https:// URL, got: ${url}\n\n` +
        'Note: UPSTASH_REDIS_REST_URL should be the REST API URL (https://...), not a Redis CLI connection string (redis://...).\n' +
        'Get the correct URL from: https://console.upstash.com/redis -> Your Database -> REST API'
      )
    }

    redis = new Redis({
      url,
      token,
    })
    console.log('✅ Upstash Redis client initialized (manual)')
    return redis
  }
}

/**
 * Store raw blob in Redis (Layer 1)
 */
export async function storeRawBlob(workMeId: string, rawBlob: string, ttl: number = 24 * 60 * 60): Promise<string> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:raw:${workMeId}`
    
    await redisClient.setex(key, ttl, rawBlob)
    console.log(`✅ Raw blob stored in Redis: ${key} (TTL: ${ttl}s)`)
    return key
  } catch (error: any) {
    console.error('❌ Redis store error:', error)
    throw error
  }
}

/**
 * Store proposed CompanyX data in Redis (Layer 1 output)
 */
export async function storeProposedCompanyX(workMeId: string, proposedData: any, ttl: number = 24 * 60 * 60): Promise<string> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:proposed:${workMeId}`
    
    await redisClient.setex(key, ttl, JSON.stringify(proposedData))
    console.log(`✅ Proposed CompanyX stored in Redis: ${key}`)
    return key
  } catch (error: any) {
    console.error('❌ Redis store error:', error)
    throw error
  }
}

/**
 * Store parsed CompanyX data in Redis (Layer 2 - progressive parsing)
 */
export async function storeParsedCompanyX(workMeId: string, parsedData: any, ttl: number = 7 * 24 * 60 * 60): Promise<string> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:parsed:${workMeId}`
    
    await redisClient.setex(key, ttl, JSON.stringify(parsedData))
    console.log(`✅ Parsed CompanyX stored in Redis: ${key}`)
    return key
  } catch (error: any) {
    console.error('❌ Redis store error:', error)
    throw error
  }
}

/**
 * Store pending field groups in Redis (Layer 2 - what's left to parse)
 */
export async function storePendingFieldGroups(workMeId: string, pendingGroups: string[], ttl: number = 7 * 24 * 60 * 60): Promise<string> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:pending:${workMeId}`
    
    await redisClient.setex(key, ttl, JSON.stringify(pendingGroups))
    console.log(`✅ Pending field groups stored in Redis: ${key}`)
    return key
  } catch (error: any) {
    console.error('❌ Redis store error:', error)
    throw error
  }
}

/**
 * Store sections array in Redis (Mapper Step 1)
 */
export async function storeSections(workMeId: string, sections: any[], ttl: number = 30 * 60): Promise<string> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:sections:${workMeId}`
    
    await redisClient.setex(key, ttl, JSON.stringify(sections))
    console.log(`✅ Sections stored in Redis: ${key} (${sections.length} sections)`)
    return key
  } catch (error: any) {
    console.error('❌ Redis store error:', error)
    throw error
  }
}

/**
 * Store hydrated model in Redis (Mapper Step 3)
 */
export async function storeHydratedModel(workMeId: string, sectionId: string, model: any, ttl: number = 30 * 60): Promise<string> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:models:${workMeId}:${sectionId}`
    
    await redisClient.setex(key, ttl, JSON.stringify(model))
    console.log(`✅ Hydrated model stored in Redis: ${key}`)
    return key
  } catch (error: any) {
    console.error('❌ Redis store error:', error)
    throw error
  }
}

/**
 * Get raw blob from Redis
 */
export async function getRawBlob(workMeId: string): Promise<string | null> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:raw:${workMeId}`
    const result = await redisClient.get(key)
    return result as string | null
  } catch (error: any) {
    console.error('❌ Redis get error:', error)
    return null
  }
}

/**
 * Get proposed CompanyX from Redis
 */
export async function getProposedCompanyX(workMeId: string): Promise<any | null> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:proposed:${workMeId}`
    const result = await redisClient.get(key)
    if (!result) return null
    return JSON.parse(result as string)
  } catch (error: any) {
    console.error('❌ Redis get error:', error)
    return null
  }
}

/**
 * Get parsed CompanyX from Redis
 */
export async function getParsedCompanyX(workMeId: string): Promise<any | null> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:parsed:${workMeId}`
    const result = await redisClient.get(key)
    if (!result) return null
    return JSON.parse(result as string)
  } catch (error: any) {
    console.error('❌ Redis get error:', error)
    return null
  }
}

/**
 * Get pending field groups from Redis
 */
export async function getPendingFieldGroups(workMeId: string): Promise<string[]> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:pending:${workMeId}`
    const result = await redisClient.get(key)
    if (!result) return []
    return JSON.parse(result as string)
  } catch (error: any) {
    console.error('❌ Redis get error:', error)
    return []
  }
}

/**
 * Get sections array from Redis
 * ALWAYS JSON-parsed
 */
export async function getSections(workMeId: string): Promise<any[]> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:sections:${workMeId}`
    const result = await redisClient.get(key)
    if (!result) return []
    const parsed = JSON.parse(result as string)
    return Array.isArray(parsed) ? parsed : []
  } catch (error: any) {
    console.error('❌ Redis get error:', error)
    return []
  }
}

/**
 * Update a single section in the sections array
 * ALWAYS JSON-stringified
 */
export async function updateSection(
  workMeId: string,
  sectionId: string,
  updates: { type?: string; status?: 'pending' | 'mapped' | 'hydrated' }
): Promise<void> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:sections:${workMeId}`
    const result = await redisClient.get(key)
    const sections: any[] = result ? JSON.parse(result as string) : []
    
    // Find and update the section
    const sectionIndex = sections.findIndex((s) => s.id === sectionId)
    if (sectionIndex === -1) {
      throw new Error(`Section ${sectionId} not found`)
    }

    // Update section
    sections[sectionIndex] = {
      ...sections[sectionIndex],
      ...updates,
    }

    // Save back to Redis (JSON-stringified)
    await redisClient.setex(key, 30 * 60, JSON.stringify(sections))
    console.log(`✅ Updated section ${sectionId} in Redis`)
  } catch (error: any) {
    console.error('❌ Redis update error:', error)
    throw error
  }
}

/**
 * Get hydrated model from Redis
 */
export async function getHydratedModel(workMeId: string, sectionId: string): Promise<any | null> {
  try {
    const redisClient = getRedis()
    const key = `workstuff:models:${workMeId}:${sectionId}`
    const result = await redisClient.get(key)
    if (!result) return null
    return JSON.parse(result as string)
  } catch (error: any) {
    console.error('❌ Redis get error:', error)
    return null
  }
}

/**
 * Delete all workstuff keys for a workMeId (cleanup after publish)
 */
export async function deleteWorkstuffKeys(workMeId: string): Promise<void> {
  try {
    const redisClient = getRedis()
    const keys = [
      `workstuff:raw:${workMeId}`,
      `workstuff:proposed:${workMeId}`,
      `workstuff:parsed:${workMeId}`,
      `workstuff:pending:${workMeId}`,
      `workstuff:sections:${workMeId}`,
    ]
    
    await Promise.all(keys.map(key => redisClient.del(key)))
    console.log(`✅ Deleted all workstuff keys for ${workMeId}`)
  } catch (error: any) {
    console.error('❌ Redis delete error:', error)
    throw error
  }
}
