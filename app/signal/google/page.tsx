'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { Search, ExternalLink, XCircle, Download, Loader2 } from 'lucide-react'
import type { GoogleScanResponse, SignalSearchResult } from '@/lib/types/signal'

export default function GoogleScanPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GoogleScanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ingesting, setIngesting] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)
    setIngesting(null)

    try {
      const response = await api.post<GoogleScanResponse>('/api/signalingest/google/scan', {
        query: query.trim(),
      })

      if (response.data.success) {
        setResults(response.data)
      } else {
        setError('Failed to scan signal')
      }
    } catch (err: any) {
      console.error('Google scan error:', err)
      setError(err.response?.data?.error || 'Failed to scan signal')
    } finally {
      setLoading(false)
    }
  }

  const handleIngestArticle = async (index: number, article: SignalSearchResult) => {
    setIngesting(index)
    setError(null)

    try {
      const response = await api.post('/api/signalingest/clip/parse', {
        title: article.title,
        url: article.url,
        snippet: article.snippet,
        source: article.source,
        date: article.date,
      })

      if (response.data.success) {
        const successMsg = `Article ingested as ${response.data.inferredType}`
        setError(null)
        alert(successMsg)
      } else {
        setError(response.data.error || 'Failed to ingest article')
      }
    } catch (err: any) {
      console.error('Ingest article error:', err)
      setError(err.response?.data?.error || 'Failed to ingest article')
    } finally {
      setIngesting(null)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/signin')
                }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link href="/signal" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
                ← Back to Signals
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <Search className="h-8 w-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">Google Scan</h1>
              </div>
              <p className="text-gray-600">Perform a broad keyword-based web/news search</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="mb-4">
                <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Query
                </label>
                <input
                  id="query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 'CVN-79 JFK', 'AUKUS submarine industrial base', 'Prime Minister visit US defense shipyard'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Scan Web & News
                  </>
                )}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                    {results.totalResults !== undefined && (
                      <span className="text-sm text-gray-500">{results.totalResults} results</span>
                    )}
                  </div>
                </div>

                {results.results.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {results.results.map((result: SignalSearchResult, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 flex-1">{result.title}</h3>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 ml-4"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.snippet}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline truncate max-w-md"
                            >
                              {result.url}
                            </a>
                            {result.source && <span>Source: {result.source}</span>}
                            {result.date && <span>{result.date}</span>}
                          </div>
                          <button
                            onClick={() => handleIngestArticle(index, result)}
                            disabled={ingesting === index}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Ingest article - infer type and parse into CompanyX model"
                          >
                            {ingesting === index ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Ingesting...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                                Ingest Article
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No results found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

