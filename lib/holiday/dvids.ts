/**
 * DVIDS Downloader
 * 
 * Fetches images from DVIDS (Defense Visual Information Distribution Service)
 * and extracts metadata
 */

import { downloadAndSaveImage } from './storage'

export interface DVIDSMetadata {
  title?: string
  description?: string
  photographer?: string
  date?: string
  location?: string
  tags?: string[]
}

/**
 * Extract DVIDS image URL from a query URL or direct image URL
 */
export function extractDVIDSImageUrl(inputUrl: string): string {
  // If it's already a direct image URL, return it
  if (inputUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return inputUrl
  }

  // Try to extract from DVIDS query URL
  // DVIDS URLs typically look like: https://www.dvidshub.net/image/1234567/...
  const dvidshubMatch = inputUrl.match(/dvidshub\.net\/image\/(\d+)/)
  if (dvidshubMatch) {
    // Construct direct image URL (this is a simplified approach)
    // In production, you might need to fetch the page and extract the actual image URL
    return inputUrl
  }

  // If we can't parse it, return as-is and let the download function handle it
  return inputUrl
}

/**
 * Fetch DVIDS page and extract metadata
 */
export async function fetchDVIDSMetadata(url: string): Promise<DVIDSMetadata> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch DVIDS page: ${response.statusText}`)
    }

    const html = await response.text()

    // Extract metadata from HTML (simplified - in production, use a proper HTML parser)
    const metadata: DVIDSMetadata = {}

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    if (titleMatch) {
      metadata.title = titleMatch[1].trim()
    }

    // Extract description from meta tags
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)
    if (descMatch) {
      metadata.description = descMatch[1].trim()
    }

    // Extract other metadata as needed
    // This is a simplified parser - in production, use cheerio or similar

    return metadata
  } catch (error: any) {
    console.error('[DVIDS] Failed to fetch metadata:', error)
    // Return empty metadata if fetch fails
    return {}
  }
}

/**
 * Import asset from DVIDS URL
 */
export async function importDVIDSAsset(
  inputUrl: string,
  category: string,
): Promise<{ filename: string; path: string; publicUrl: string; metadata: DVIDSMetadata }> {
  // Extract image URL
  const imageUrl = extractDVIDSImageUrl(inputUrl)

  // Fetch metadata
  const metadata = await fetchDVIDSMetadata(inputUrl)

  // Download and save image
  const { filename, path, publicUrl } = await downloadAndSaveImage(
    imageUrl,
    category,
    metadata.title || 'dvids-image',
  )

  return {
    filename,
    path,
    publicUrl,
    metadata,
  }
}

