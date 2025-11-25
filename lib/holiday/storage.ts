/**
 * File Storage Helpers for Holiday Builder System
 * 
 * Handles local file storage for assets
 */

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'

const ASSETS_BASE_PATH = join(process.cwd(), 'public', 'assets')

/**
 * Generate a hashed filename from URL or original filename
 */
export function generateHashedFilename(url: string, originalName?: string): string {
  const hash = createHash('md5').update(url).digest('hex').substring(0, 12)
  const extension = originalName?.split('.').pop() || url.split('.').pop() || 'jpg'
  return `${hash}.${extension}`
}

/**
 * Get the storage path for an asset based on category
 */
export function getAssetStoragePath(category: string, filename: string): string {
  return join(ASSETS_BASE_PATH, category, filename)
}

/**
 * Get the public URL for an asset
 */
export function getAssetPublicUrl(category: string, filename: string): string {
  return `/assets/${category}/${filename}`
}

/**
 * Ensure directory exists for a category
 */
export async function ensureCategoryDirectory(category: string): Promise<void> {
  const dirPath = join(ASSETS_BASE_PATH, category)
  try {
    await mkdir(dirPath, { recursive: true })
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

/**
 * Download and save an image from URL
 */
export async function downloadAndSaveImage(
  url: string,
  category: string,
  originalName?: string,
): Promise<{ filename: string; path: string; publicUrl: string }> {
  // Ensure directory exists
  await ensureCategoryDirectory(category)

  // Generate filename
  const filename = generateHashedFilename(url, originalName)
  const filePath = getAssetStoragePath(category, filename)
  const publicUrl = getAssetPublicUrl(category, filename)

  // Download image
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())

  // Save to disk
  await writeFile(filePath, buffer)

  return {
    filename,
    path: filePath,
    publicUrl,
  }
}

