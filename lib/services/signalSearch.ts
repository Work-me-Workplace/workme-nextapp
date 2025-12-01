/**
 * Signal Search Service (OSINT)
 * 
 * Performs public web/news searches for signal verification.
 * Uses serper.dev or Bing Web Search API.
 * 
 * NO AI inference, NO hallucination - pure OSINT lookup.
 */

import type { SignalSearchResult } from '@/lib/types/signal'

interface SerperSearchResponse {
  organic: Array<{
    title: string
    link: string
    snippet: string
    date?: string
  }>
  news?: Array<{
    title: string
    link: string
    snippet: string
    date?: string
    source?: string
  }>
}

interface BingSearchResponse {
  webPages?: {
    value: Array<{
      name: string
      url: string
      snippet: string
      dateLastCrawled?: string
    }>
  }
  news?: {
    value: Array<{
      name: string
      url: string
      description: string
      datePublished?: string
      provider?: Array<{ name: string }>
    }>
  }
}

/**
 * Search using serper.dev API
 */
async function searchWithSerper(query: string): Promise<SignalSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    throw new Error('SERPER_API_KEY environment variable is not set')
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: 10,
    }),
  })

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.statusText}`)
  }

  const data: SerperSearchResponse = await response.json()
  const results: SignalSearchResult[] = []

  // Add organic results
  if (data.organic) {
    results.push(
      ...data.organic.map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        date: item.date,
      }))
    )
  }

  // Add news results
  if (data.news) {
    results.push(
      ...data.news.map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: item.source,
        date: item.date,
      }))
    )
  }

  return results
}

/**
 * Search using Bing Web Search API
 */
async function searchWithBing(query: string): Promise<SignalSearchResult[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY
  const endpoint = process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search'

  if (!apiKey) {
    throw new Error('BING_SEARCH_API_KEY environment variable is not set')
  }

  const response = await fetch(
    `${endpoint}?q=${encodeURIComponent(query)}&count=10&mkt=en-US`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Bing API error: ${response.statusText}`)
  }

  const data: BingSearchResponse = await response.json()
  const results: SignalSearchResult[] = []

  // Add web results
  if (data.webPages?.value) {
    results.push(
      ...data.webPages.value.map((item) => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        date: item.dateLastCrawled,
      }))
    )
  }

  // Add news results
  if (data.news?.value) {
    results.push(
      ...data.news.value.map((item) => ({
        title: item.name,
        url: item.url,
        snippet: item.description,
        source: item.provider?.[0]?.name,
        date: item.datePublished,
      }))
    )
  }

  return results
}

/**
 * Main entry point for signal search
 * 
 * Tries serper.dev first, falls back to Bing if serper is not configured.
 * 
 * @param query - Search query string
 * @returns Array of search results
 */
export async function searchPublicSignal(query: string): Promise<SignalSearchResult[]> {
  if (!query || !query.trim()) {
    return []
  }

  // Try serper.dev first (preferred)
  if (process.env.SERPER_API_KEY) {
    try {
      return await searchWithSerper(query.trim())
    } catch (error: any) {
      console.error('[signalSearch] Serper error:', error.message)
      // Fall through to Bing if serper fails
    }
  }

  // Fallback to Bing
  if (process.env.BING_SEARCH_API_KEY) {
    try {
      return await searchWithBing(query.trim())
    } catch (error: any) {
      console.error('[signalSearch] Bing error:', error.message)
      throw new Error('Both search APIs failed. Please configure SERPER_API_KEY or BING_SEARCH_API_KEY')
    }
  }

  throw new Error(
    'No search API configured. Please set SERPER_API_KEY or BING_SEARCH_API_KEY environment variable'
  )
}

