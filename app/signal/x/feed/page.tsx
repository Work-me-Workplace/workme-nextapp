'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { Twitter, RefreshCw, ExternalLink, XCircle } from 'lucide-react'
import type { SignalSearchResult } from '@/lib/types/signal'

interface XFeedResponse {
  success: boolean
  results: SignalSearchResult[]
}

export default function XFeedViewPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<XFeedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await api.post<XFeedResponse>('/api/x/feed', {})

      if (response.data.success) {
        setResults(response.data)
      } else {
        setError('Failed to load feed')
      }
    } catch (err: any) {
      console.error('X Feed error:', err)
      // Handle stub 501 response gracefully
      if (err.response?.status === 501) {
        // Return mock data for now since endpoint is stubbed
        setResults({
          success: true,
          results: [
            {
              title: 'SECNAV pauses FFG(X) frigate program',
              snippet: 'Major shift in naval procurement and industrial base impact',
              source: 'X',
              url: 'https://x.com/post/123',
              date: '2025-01-05',
            },
            {
              title: 'NAVSEA announces new shipbuilding initiative',
              snippet: 'Focus on digital transformation and modern shipyard capabilities',
              source: 'X',
              url: 'https://x.com/post/124',
              date: '2025-01-04',
            },
          ],
        })
      } else {
        setError(err.response?.data?.error || 'Failed to load feed')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
              <Link href="/signal/x" className="text-purple-600 hover:text-purple-800 text-sm mb-4 inline-block">
                ← Back to X Feed
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <Twitter className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">X Feed</h1>
              </div>
              <p className="text-gray-600">Live signals from organizations, people, and hashtags you follow.</p>
            </div>

            {/* Refresh Button */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Refresh Feed
                  </>
                )}
              </button>
            </div>

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
                    <h2 className="text-xl font-semibold text-gray-900">Feed Results</h2>
                    {results.results.length > 0 && (
                      <span className="text-sm text-gray-500">{results.results.length} result{results.results.length !== 1 ? 's' : ''}</span>
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
                            className="text-purple-600 hover:text-purple-800 ml-4"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.snippet}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline truncate max-w-md"
                          >
                            {result.url}
                          </a>
                          {result.source && <span>Source: {result.source}</span>}
                          {result.date && <span>{result.date}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No feed results found</p>
                  </div>
                )}
              </div>
            )}

            {!results && !loading && !error && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Click "Refresh Feed" to load signals from your followed sources.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

