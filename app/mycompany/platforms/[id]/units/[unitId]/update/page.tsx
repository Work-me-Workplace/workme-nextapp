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

interface UpdateData {
  percentComplete?: number | null
  statusUpdate?: string | null
  scheduleNote?: string | null
  industrialBaseNote?: string | null
  leadershipQuote?: string | null
  keelLaidDate?: string | null
  seaTrialsStartDate?: string | null
  deliveryDate?: string | null
  commissioningDate?: string | null
  narrativeSummary?: string | null
  tags?: string[]
}

export default function UpdatePage({ params }: { params: Promise<{ id: string; unitId: string }> }) {
  const { id: platformId, unitId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [reviewData, setReviewData] = useState<UpdateData | null>(null)
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
      const response = await api.post('/api/platform/unit/update/ai-parse', { text: aiText })

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

  async function handleSubmit() {
    if (!reviewData) {
      alert('No data to save')
      return
    }

    try {
      setLoading(true)
      const response = await api.post(`/api/company/products/platform/unit/${unitId}/update`, reviewData)

      if (response.data.success) {
        setSuccess(true)
      } else {
        alert('Failed to save update: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to save update:', error)
      alert('Failed to save update: ' + (error.response?.data?.error || error.message))
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Review the parsed data below. You can edit fields before saving.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Percent Complete</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={reviewData.percentComplete || ''}
                          onChange={(e) => setReviewData({ 
                            ...reviewData, 
                            percentComplete: e.target.value ? parseInt(e.target.value) : null 
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status Update</label>
                        <input
                          type="text"
                          value={reviewData.statusUpdate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, statusUpdate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., Keel Laid, Construction 60% complete"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Note</label>
                      <input
                        type="text"
                        value={reviewData.scheduleNote || ''}
                        onChange={(e) => setReviewData({ ...reviewData, scheduleNote: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industrial Base Note</label>
                      <input
                        type="text"
                        value={reviewData.industrialBaseNote || ''}
                        onChange={(e) => setReviewData({ ...reviewData, industrialBaseNote: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Leadership Quote</label>
                      <textarea
                        rows={2}
                        value={reviewData.leadershipQuote || ''}
                        onChange={(e) => setReviewData({ ...reviewData, leadershipQuote: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Keel Laid Date</label>
                        <input
                          type="date"
                          value={reviewData.keelLaidDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, keelLaidDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sea Trials Start Date</label>
                        <input
                          type="date"
                          value={reviewData.seaTrialsStartDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, seaTrialsStartDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                        <input
                          type="date"
                          value={reviewData.deliveryDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, deliveryDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Commissioning Date</label>
                        <input
                          type="date"
                          value={reviewData.commissioningDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, commissioningDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Narrative Summary</label>
                      <textarea
                        rows={3}
                        value={reviewData.narrativeSummary || ''}
                        onChange={(e) => setReviewData({ ...reviewData, narrativeSummary: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={reviewData.tags?.join(', ') || ''}
                        onChange={(e) => setReviewData({ 
                          ...reviewData, 
                          tags: e.target.value ? e.target.value.split(',').map(t => t.trim()).filter(t => t) : []
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="milestone, schedule, construction"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4">
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
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Update'}
                    </button>
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
