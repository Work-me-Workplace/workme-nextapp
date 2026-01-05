'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Newspaper, Loader2, AlertCircle, CheckCircle, Link as LinkIcon } from 'lucide-react'

export default function ClipPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [artifactId, setArtifactId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

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
  }, [router])

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
        setText(article.textContent || article.content || '')
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
        setTimeout(() => {
          router.push(`/signal/clip/${response.data.data.id}/parse`)
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
                  <p className="text-gray-600 mt-1">Step 1: Enter URL or paste article text</p>
                </div>
              </div>

              {/* Input Mode Toggle */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => {
                    setInputMode('url')
                    setError(null)
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
              </div>

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
                  onChange={(e) => setText(e.target.value)}
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





