/**
 * DVIDS Importer Utility
 * 
 * Extracts image URLs and metadata from DVIDS HTML pages
 * DVIDS (Defense Visual Information Distribution Service) is a DoD media distribution system
 */

import { parseHTML } from 'linkedom'

export interface DVIDSImageData {
  imageUrl: string
  title?: string
  description?: string
  photographer?: string
  date?: string
  tags?: string[]
}

/**
 * Parse DVIDS HTML page and extract image information
 */
export async function parseDVIDSPage(dvidsUrl: string): Promise<DVIDSImageData | null> {
  try {
    // Fetch the DVIDS page
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch(dvidsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch DVIDS page: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const { document } = parseHTML(html)

    // Extract image URL - DVIDS typically has images in various formats
    // Look for common patterns: og:image, main image, or high-res image
    let imageUrl: string | null = null

    // Try Open Graph image first
    const ogImage = document.querySelector('meta[property="og:image"]')
    if (ogImage) {
      imageUrl = ogImage.getAttribute('content') || null
    }

    // Try main image tag
    if (!imageUrl) {
      const mainImage = document.querySelector('img[class*="main"], img[class*="featured"], img[id*="main"]')
      if (mainImage) {
        imageUrl = mainImage.getAttribute('src') || mainImage.getAttribute('data-src') || null
      }
    }

    // Try any large image
    if (!imageUrl) {
      const images = document.querySelectorAll('img')
      for (const img of Array.from(images)) {
        const src = img.getAttribute('src') || img.getAttribute('data-src')
        if (src && (src.includes('dvidshub') || src.includes('dodmedia') || src.match(/\.(jpg|jpeg|png)$/i))) {
          // Prefer full-size images
          if (src.includes('large') || src.includes('full') || !src.includes('thumb')) {
            imageUrl = src
            break
          }
        }
      }
    }

    // Make URL absolute if relative
    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = new URL(dvidsUrl)
      imageUrl = new URL(imageUrl, baseUrl.origin).href
    }

    if (!imageUrl) {
      throw new Error('Could not find image URL in DVIDS page')
    }

    // Extract metadata
    const title = 
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('title')?.textContent?.trim() ||
      null

    const description =
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      null

    // Try to extract photographer/credit
    let photographer: string | null = null
    const creditSelectors = [
      '[class*="photographer"]',
      '[class*="credit"]',
      '[class*="byline"]',
      '[id*="photographer"]',
      '[id*="credit"]',
    ]
    for (const selector of creditSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        photographer = element.textContent?.trim() || null
        if (photographer) break
      }
    }

    // Extract date if available
    let date: string | null = null
    const dateSelectors = [
      'time[datetime]',
      '[class*="date"]',
      '[property="article:published_time"]',
    ]
    for (const selector of dateSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        date = element.getAttribute('datetime') || element.getAttribute('content') || element.textContent?.trim() || null
        if (date) break
      }
    }

    // Extract tags if available
    const tags: string[] = []
    const tagElements = document.querySelectorAll('[class*="tag"], [class*="keyword"], a[href*="/tag/"]')
    tagElements.forEach((el) => {
      const tagText = el.textContent?.trim()
      if (tagText && tagText.length > 0 && tagText.length < 50) {
        tags.push(tagText)
      }
    })

    return {
      imageUrl,
      title: title || undefined,
      description: description || undefined,
      photographer: photographer || undefined,
      date: date || undefined,
      tags: tags.length > 0 ? tags : undefined,
    }
  } catch (error: any) {
    console.error('[DVIDS Parser] Error:', error.message)
    throw error
  }
}

/**
 * Download image from URL and return as buffer
 */
export async function downloadImage(imageUrl: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Extract filename from URL or use default
  const urlPath = new URL(imageUrl).pathname
  const filename = urlPath.split('/').pop() || `dvidshub-${Date.now()}.jpg`

  return { buffer, contentType, filename }
}
