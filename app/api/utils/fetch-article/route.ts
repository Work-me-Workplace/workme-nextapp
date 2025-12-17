/**
 * POST /api/utils/fetch-article
 * 
 * Fetch and extract article content from a URL
 * 
 * Flow:
 * 1. Accept a URL in request body
 * 2. Fetch HTML with fetch()
 * 3. Parse with linkedom (serverless-compatible DOM)
 * 4. Attempt extraction with @mozilla/readability
 * 5. If content is too short or fails, fallback to unfluff
 * 6. If both fail, return error telling UI to ask user to paste manually
 * 
 * AUTH: Optional (can be used without auth for utility purposes)
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseHTML } from 'linkedom'
import { Readability } from '@mozilla/readability'
import unfluff from 'unfluff'

export const dynamic = 'force-dynamic'

// Minimum content length to consider extraction successful
const MIN_CONTENT_LENGTH = 200

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log('[API POST /api/utils/fetch-article] Fetching:', url)

    // Fetch HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          requiresManualPaste: true 
        },
        { status: response.status }
      )
    }

    const html = await response.text()

    if (!html || html.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No content found at URL',
          requiresManualPaste: true 
        },
        { status: 400 }
      )
    }

    // Parse with linkedom (serverless-compatible)
    const { document } = parseHTML(html)

    let extractedContent: {
      title: string
      content: string
      textContent: string
      excerpt?: string
      byline?: string
      siteName?: string
    } | null = null

    // Try @mozilla/readability first
    try {
      const reader = new Readability(document)
      const article = reader.parse()

      if (article && article.textContent && article.textContent.trim().length >= MIN_CONTENT_LENGTH) {
        extractedContent = {
          title: article.title || '',
          content: article.content || '',
          textContent: article.textContent || '',
          excerpt: article.excerpt || undefined,
          byline: article.byline || undefined,
          siteName: article.siteName || undefined,
        }

        console.log('[API POST /api/utils/fetch-article] Readability success:', {
          titleLength: extractedContent.title.length,
          contentLength: extractedContent.textContent.length,
        })
      }
    } catch (error: any) {
      console.log('[API POST /api/utils/fetch-article] Readability failed:', error.message)
    }

    // Fallback to unfluff if readability failed or content too short
    if (!extractedContent || extractedContent.textContent.trim().length < MIN_CONTENT_LENGTH) {
      try {
        const data = unfluff(html, 'en') as any

        if (data && data.text && typeof data.text === 'string' && data.text.trim().length >= MIN_CONTENT_LENGTH) {
          extractedContent = {
            title: (data.title || '').trim(),
            content: data.text || '',
            textContent: data.text || '',
            excerpt: data.description ? String(data.description).trim() : undefined,
            byline: data.author 
              ? (Array.isArray(data.author) ? data.author.join(', ') : String(data.author)).trim()
              : undefined,
            siteName: data.publisher ? String(data.publisher).trim() : undefined,
          }

          console.log('[API POST /api/utils/fetch-article] Unfluff success:', {
            titleLength: extractedContent.title.length,
            contentLength: extractedContent.textContent.length,
          })
        }
      } catch (error: any) {
        console.log('[API POST /api/utils/fetch-article] Unfluff failed:', error.message)
      }
    }

    // If both methods failed, return error
    if (!extractedContent || extractedContent.textContent.trim().length < MIN_CONTENT_LENGTH) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Could not extract article content. Content may be too short or in an unsupported format.',
          requiresManualPaste: true 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        title: extractedContent.title,
        content: extractedContent.content,
        textContent: extractedContent.textContent,
        excerpt: extractedContent.excerpt,
        byline: extractedContent.byline,
        siteName: extractedContent.siteName,
        url: urlObj.href,
      },
    })
  } catch (error: any) {
    console.error('❌ POST /api/utils/fetch-article error:', error)

    // Network errors, parsing errors, etc.
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch article',
        requiresManualPaste: true 
      },
      { status: 500 }
    )
  }
}


