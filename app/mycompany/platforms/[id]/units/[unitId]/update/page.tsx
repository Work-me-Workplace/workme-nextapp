'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { RefreshCw, ArrowLeft, Wand2, Loader2, CheckCircle, Link as LinkIcon, Newspaper, AlertCircle } from 'lucide-react'

interface IngestedData {
  artifactType: string
  aiSummary: string
  sentiment: string
  humanElements: {
    sponsor?: string | null
    leaders?: string[]
    attendees?: string[]
    roles?: Record<string, string>
  } | null
  noteworthyItems: {
    keyFacts?: string[]
    dates?: string[]
    milestones?: string[]
    locations?: string[]
  } | null
  leaderStatement: {
    statement?: string | null
    leader?: string | null
    role?: string | null
  } | null
  rawText: string
  headline?: string | null
  sourceUrl?: string | null
  sourceName?: string | null
}

export default function UpdatePage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id: platformId, unitId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [reviewData, setReviewData] = useState<IngestedData | null>(null)
  const [aiText, setAiText] = useState('')
  const [url, setUrl] = useState('')
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

      const response = await api.post('/api/utils/fetch-article', { url: url.trim() })

      if (response.data.success && response.data.data) {
        const article = response.data.data
        setAiText(article.textContent || article.content || '')
        setUrl(article.url || url)
        setError(null)
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

  async function handleAIParse() {
    if (!aiText.trim()) {
      setError('Please provide article text (either via URL or paste)')
      return
    }

    try {
      setParsing(true)
      setError(null)
      const response = await api.post('/api/utils/news-artifact/ingest', { 
        text: aiText,
        sourceUrl: url || undefined,
        headline: aiText.split('\n')[0]?.substring(0, 200) || undefined,
      })

      if (response.data.success && response.data.data) {
        setReviewData(response.data.data)
        setError(null)
      } else {
        setError('Failed to parse: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to parse with AI:', error)
      setError('Failed to parse: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  async function handleSaveArtifact() {
    if (!reviewData) {
      setError('No data to save')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Save as CompanyNewsArtifact with full intelligence
      const response = await api.post('/api/utils/news-artifact/create', {
        rawText: reviewData.rawText,
        aiSummary: reviewData.aiSummary,
        artifactType: reviewData.artifactType,
        sentiment: reviewData.sentiment,
        humanElements: reviewData.humanElements,
        noteworthyItems: reviewData.noteworthyItems,
        leaderStatement: reviewData.leaderStatement,
        sourceUrl: reviewData.sourceUrl,
        sourceName: reviewData.sourceName,
        headline: reviewData.headline,
      })

      if (response.data.success) {
        setSuccess(true)
      } else {
        setError('Failed to save artifact: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to save artifact:', error)
      setError('Failed to save artifact: ' + (error.response?.data?.error || error.message))
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
              href={`/mycompany/platforms/${platformId}/units/${unitId}`}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Unit
            </Link>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <RefreshCw className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Add Update</h1>
              </div>

              {success ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <h2 className="text-xl font-semibold text-green-900">Update Saved Successfully!</h2>
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                      <Link
                        href={`/mycompany/platforms/${platformId}/units/${unitId}`}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        View Unit
                      </Link>
                    </div>
                  </div>
                </div>
              ) : !reviewData ? (
                <div className="space-y-6">
                  {/* Input Mode Toggle */}
                  <div className="flex gap-4">
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
                    <div className="space-y-4">
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
                            disabled={fetching || parsing}
                          />
                          <button
                            onClick={handleFetchUrl}
                            disabled={fetching || parsing || !url.trim()}
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
                  <div>
                    <label htmlFor="aiText" className="block text-sm font-medium text-gray-700 mb-2">
                      Article Text {inputMode === 'url' && '(will be populated from URL)'}
                    </label>
                    <textarea
                      id="aiText"
                      rows={12}
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder={inputMode === 'url' ? 'Click "Fetch" to load article content...' : 'Paste any article, press release, or status report about this platform unit...'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      disabled={fetching || parsing}
                    />
                    {aiText && (
                      <p className="text-sm text-gray-500 mt-2">
                        {aiText.length} characters
                      </p>
                    )}
                    {!aiText && (
                      <p className="text-sm text-gray-500 mt-2">
                        AI will extract update information from your text.
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
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

                  <div className="flex items-center justify-end space-x-4">
                    <Link
                      href={`/mycompany/platforms/${platformId}/units/${unitId}`}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleAIParse}
                      disabled={parsing || fetching || !aiText.trim()}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {parsing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Ingest with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Article Intelligence Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Article Intelligence</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium text-gray-900">{reviewData.artifactType?.replace('_', ' ').toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sentiment</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          reviewData.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          reviewData.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reviewData.sentiment?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">AI Summary</p>
                      <textarea
                        rows={4}
                        value={reviewData.aiSummary}
                        onChange={(e) => setReviewData({ ...reviewData, aiSummary: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Human Elements */}
                  {reviewData.humanElements && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Human Elements</h3>
                      <div className="space-y-2 text-sm">
                        {reviewData.humanElements.sponsor && (
                          <p><span className="font-medium">Sponsor:</span> {reviewData.humanElements.sponsor}</p>
                        )}
                        {reviewData.humanElements.leaders && reviewData.humanElements.leaders.length > 0 && (
                          <p><span className="font-medium">Leaders:</span> {reviewData.humanElements.leaders.join(', ')}</p>
                        )}
                        {reviewData.humanElements.attendees && reviewData.humanElements.attendees.length > 0 && (
                          <p><span className="font-medium">Attendees:</span> {reviewData.humanElements.attendees.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Noteworthy Items */}
                  {reviewData.noteworthyItems && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Noteworthy Items</h3>
                      <div className="space-y-3">
                        {reviewData.noteworthyItems.keyFacts && reviewData.noteworthyItems.keyFacts.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Key Facts</p>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {reviewData.noteworthyItems.keyFacts.map((fact, i) => (
                                <li key={i}>{fact}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {reviewData.noteworthyItems.milestones && reviewData.noteworthyItems.milestones.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Milestones</p>
                            <div className="flex flex-wrap gap-2">
                              {reviewData.noteworthyItems.milestones.map((m, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {reviewData.noteworthyItems.dates && reviewData.noteworthyItems.dates.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Dates</p>
                            <div className="flex flex-wrap gap-2">
                              {reviewData.noteworthyItems.dates.map((d, i) => (
                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{d}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Leader Statement */}
                  {reviewData.leaderStatement && reviewData.leaderStatement.statement && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Leader Statement</h3>
                      <blockquote className="italic text-gray-700 mb-2">"{reviewData.leaderStatement.statement}"</blockquote>
                      {reviewData.leaderStatement.leader && (
                        <p className="text-sm text-gray-600">
                          — {reviewData.leaderStatement.leader}
                          {reviewData.leaderStatement.role && `, ${reviewData.leaderStatement.role}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t pt-6">
                    <p className="text-sm text-gray-600 mb-4">What would you like to do with this article?</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          setReviewData(null)
                          setAiText('')
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Start Over
                      </button>
                      <button
                        onClick={handleSaveArtifact}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : 'Save as News Artifact'}
                      </button>
                      <button
                        disabled
                        className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                        title="Coming soon"
                      >
                        Bolt to Unit Update
                      </button>
                      <button
                        disabled
                        className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
                        title="Coming soon"
                      >
                        Create Comms Product
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
