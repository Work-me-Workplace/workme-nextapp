'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Newspaper, Loader2, AlertCircle, CheckCircle, Link as LinkIcon, Search, ExternalLink } from 'lucide-react'
import type { GoogleScanResponse, SignalSearchResult } from '@/lib/types/signal'

/**
 * Normalize article text by cleaning up excessive spacing and line breaks
 * - Normalizes multiple consecutive line breaks to double line breaks (paragraph breaks)
 * - Normalizes multiple spaces to single spaces
 * - Trims each line
 * - Removes excessive blank lines
 */
function normalizeArticleText(text: string): string {
  if (!text) return text
  
  // Replace multiple consecutive line breaks (3+) with double line break (paragraph break)
  // This preserves paragraph structure while removing excessive spacing
  let normalized = text.replace(/\n{3,}/g, '\n\n')
  
  // Replace multiple spaces with single space (but preserve intentional spacing)
  normalized = normalized.replace(/[ \t]{2,}/g, ' ')
  
  // Split into lines, trim each line, and filter out completely empty lines
  const lines = normalized.split('\n').map(line => line.trim())
  
  // Join lines back, but collapse multiple empty lines into single empty line
  // This preserves paragraph breaks while removing excessive blank lines
  const cleanedLines: string[] = []
  let lastWasEmpty = false
  
  for (const line of lines) {
    if (line === '') {
      if (!lastWasEmpty) {
        cleanedLines.push('')
        lastWasEmpty = true
      }
    } else {
      cleanedLines.push(line)
      lastWasEmpty = false
    }
  }
  
  // Join lines and trim final result
  return cleanedLines.join('\n').trim()
}

function ClipPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [inputMode, setInputMode] = useState<'url' | 'text' | 'search'>('url')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [artifactId, setArtifactId] = useState<string | null>(null)
  const [unitId, setUnitId] = useState<string | null>(null)
  const [platformId, setPlatformId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SignalSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Read query params for dual compatibility
    const unitIdParam = searchParams?.get('unitId')
    const platformIdParam = searchParams?.get('platformId')
    if (unitIdParam) setUnitId(unitIdParam)
    if (platformIdParam) setPlatformId(platformIdParam)

    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setAuthReady(true)
        let id = getWorkMeIdFromStorage()
        
        if (!id) {
          try {
            const refreshed = await refreshWorkMe()
            if (refreshed) {
              id = refreshed.id
            }
          } catch (error) {
            console.error('Failed to refresh WorkMe:', error)
          }
        }
        
        if (id) {
          setWorkMeId(id)
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router, searchParams])

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setError('Please enter a search query')
      return
    }

    try {
      setSearching(true)
      setError(null)
      setSuccess(false)
      setSearchResults([])

      const response = await api.post<GoogleScanResponse>('/api/signalingest/google/scan', {
        query: searchQuery.trim(),
      })

      if (response.data.success && response.data.results) {
        setSearchResults(response.data.results)
        if (response.data.results.length === 0) {
          setError('No articles found. Try a different search query.')
        }
      } else {
        setError('Failed to search articles')
      }
    } catch (error: any) {
      console.error('Failed to search articles:', error)
      setError(error.response?.data?.error || error.message || 'Failed to search articles')
    } finally {
      setSearching(false)
    }
  }

  async function handleSelectSearchResult(result: SignalSearchResult) {
    // Set the URL and switch to URL mode, then fetch
    setUrl(result.url)
    setInputMode('url')
    setSearchResults([])
    setSearchQuery('')
    setError(null)
    setSuccess(false)
    
    // Automatically fetch the article
    try {
      setFetching(true)
      const response = await api.post('/api/utils/fetch-article', { url: result.url })

      if (response.data.success && response.data.data) {
        const article = response.data.data
        // Text is already normalized by the API, but normalize again as safety measure
        const articleText = article.textContent || article.content || ''
        setText(normalizeArticleText(articleText))
        setUrl(article.url || result.url)
        setSuccess(true)
      } else {
        if (response.data.requiresManualPaste) {
          setError(response.data.error || 'Could not extract article. Please paste the content manually.')
          setInputMode('text')
        } else {
          setError(response.data.error || 'Failed to fetch article')
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch article:', error)
      if (error.response?.data?.requiresManualPaste) {
        setError(error.response.data.error || 'Could not extract article. Please paste the content manually.')
        setInputMode('text')
      } else {
        setError(error.response?.data?.error || error.message || 'Failed to fetch article')
      }
    } finally {
      setFetching(false)
    }
  }

  async function handleFetchUrl() {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    try {
      setFetching(true)
      setError(null)
      setSuccess(false)

      const response = await api.post('/api/utils/fetch-article', { url: url.trim() })

      if (response.data.success && response.data.data) {
        const article = response.data.data
        // Text is already normalized by the API, but normalize again as safety measure
        const articleText = article.textContent || article.content || ''
        setText(normalizeArticleText(articleText))
        setUrl(article.url || url)
        setSuccess(true)
      } else {
        if (response.data.requiresManualPaste) {
          setError(response.data.error || 'Could not extract article. Please paste the content manually.')
          setInputMode('text')
        } else {
          setError(response.data.error || 'Failed to fetch article')
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch article:', error)
      if (error.response?.data?.requiresManualPaste) {
        setError(error.response.data.error || 'Could not extract article. Please paste the content manually.')
        setInputMode('text')
      } else {
        setError(error.response?.data?.error || error.message || 'Failed to fetch article')
      }
    } finally {
      setFetching(false)
    }
  }

  async function handleSave() {
    if (!text.trim()) {
      setError('Please provide article text (either via URL or paste)')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      // Extract title from text (first line or first 100 chars)
      const lines = text.trim().split('\n')
      const headline = lines[0]?.trim() || text.substring(0, 100).trim()
      const sourceName = url ? new URL(url).hostname.replace('www.', '') : null

      const response = await api.post('/api/utils/news-artifact/create', {
        sourceUrl: url || null,
        sourceName: sourceName || null,
        headline: headline,
        rawText: text.trim(),
      })

      if (response.data.success && response.data.data) {
        setArtifactId(response.data.data.id)
        setSuccess(true)
        // Navigate to parse page after a brief delay
        // Pass unitId/platformId for dual compatibility routing
        setTimeout(() => {
          const parseUrl = new URL(`/signal/clip/${response.data.data.id}/parse`, window.location.origin)
          if (unitId) parseUrl.searchParams.set('unitId', unitId)
          if (platformId) parseUrl.searchParams.set('platformId', platformId)
          router.push(parseUrl.pathname + parseUrl.search)
        }, 1000)
      } else {
        setError(response.data.error || 'Failed to save article')
      }
    } catch (error: any) {
      console.error('Failed to save article:', error)
      setError(error.response?.data?.error || error.message || 'Failed to save article')
    } finally {
      setLoading(false)
    }
  }

  if (!authReady || !workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/signal"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Signals
            </Link>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center mb-6">
                <Newspaper className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Clip Ingest Wizard</h1>
                  <p className="text-gray-600 mt-1">Step 1: Search, enter URL, or paste article text</p>
                  {unitId && (
                    <p className="text-sm text-blue-600 mt-1">
                      Creating global artifact (can be routed to unit update after parsing)
                    </p>
                  )}
                </div>
              </div>

              {/* Input Mode Toggle */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => {
                    setInputMode('url')
                    setError(null)
                    setSearchResults([])
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    inputMode === 'url'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  URL
                </button>
                <button
                  onClick={() => {
                    setInputMode('text')
                    setError(null)
                    setSearchResults([])
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    inputMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Newspaper className="w-4 h-4 inline mr-2" />
                  Paste Text
                </button>
                <button
                  onClick={() => {
                    setInputMode('search')
                    setError(null)
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    inputMode === 'search'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Search
                </button>
              </div>

              {/* Search Input */}
              {inputMode === 'search' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
                      Search for Articles
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="searchQuery"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSearch()
                          }
                        }}
                        placeholder="e.g., 'CVN-79 JFK', 'AUKUS submarine', 'defense budget 2026'"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={searching || loading}
                      />
                      <button
                        onClick={handleSearch}
                        disabled={searching || loading || !searchQuery.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                      >
                        {searching ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Search
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Search Results ({searchResults.length})
                      </h3>
                      <div className="space-y-3">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition cursor-pointer"
                            onClick={() => handleSelectSearchResult(result)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 flex-1 pr-2">
                                {result.title}
                              </h4>
                              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{result.snippet}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:underline truncate max-w-xs"
                              >
                                {result.url}
                              </a>
                              {result.source && <span>• {result.source}</span>}
                              {result.date && <span>• {result.date}</span>}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectSearchResult(result)
                              }}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Select & Fetch Article →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* URL Input */}
              {inputMode === 'url' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                      Article URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={fetching || loading}
                      />
                      <button
                        onClick={handleFetchUrl}
                        disabled={fetching || loading || !url.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                      >
                        {fetching ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          'Fetch'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Input */}
              <div className="mb-6">
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
                  Article Text {inputMode === 'url' && '(will be populated from URL)'}
                </label>
                <textarea
                  id="text"
                  rows={12}
                  value={text}
                  onChange={(e) => {
                    // Normalize text when user pastes manually
                    const normalized = normalizeArticleText(e.target.value)
                    setText(normalized)
                  }}
                  placeholder={inputMode === 'url' ? 'Click "Fetch" to load article content...' : 'Paste article text here...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  disabled={fetching || loading}
                />
                {text && (
                  <p className="text-sm text-gray-500 mt-2">
                    {text.length} characters
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                    {error.includes('paste manually') && inputMode === 'url' && (
                      <button
                        onClick={() => setInputMode('text')}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Switch to paste mode
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && artifactId && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    Article saved! Redirecting to parse page...
                  </p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading || !text.trim() || fetching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ClipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ClipPageContent />
    </Suspense>
  )
}





