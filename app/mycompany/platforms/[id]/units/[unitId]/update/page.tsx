'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { RefreshCw, ArrowLeft, Wand2, Loader2, CheckCircle, Link as LinkIcon, Newspaper, AlertCircle, Archive, Plus } from 'lucide-react'

interface IngestedData {
  // CompanyPlatformUnitUpdate fields (direct mapping)
  statusUpdate?: string | null
  percentComplete?: number | null
  scheduleNote?: string | null
  industrialBaseNote?: string | null
  leadershipQuote?: string | null
  keelLaidDate?: string | null
  seaTrialsStartDate?: string | null
  deliveryDate?: string | null
  commissioningDate?: string | null
  narrativeSummary?: string | null
  tags?: string[]
  
  // Additional metadata (for context)
  artifactType?: string
  sentiment?: string
  articleStyle?: string | null
  humanElements?: {
    sponsor?: string | null
    leaders?: string[]
    spokespeople?: string[]
  } | null
  
  // Original article data
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
  const [viewMode, setViewMode] = useState<'new' | 'bank'>('bank') // 'new' = new article, 'bank' = artifact bank
  const [statements, setStatements] = useState<any[]>([])
  const [loadingStatements, setLoadingStatements] = useState(false)
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null)

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

  // Load statements (artifact bank) when component mounts
  useEffect(() => {
    if (workMeId && unitId) {
      loadStatements()
    }
  }, [workMeId, unitId])

  async function loadStatements() {
    try {
      setLoadingStatements(true)
      // Get unit details which includes statements
      const response = await api.get(`/api/company/products/platform/unit/${unitId}`)
      if (response.data.success && response.data.unit) {
        setStatements(response.data.unit.statements || [])
      }
    } catch (error: any) {
      console.error('Failed to load statements:', error)
    } finally {
      setLoadingStatements(false)
    }
  }

  async function handleSelectStatement(statementId: string) {
    try {
      setLoadingStatements(true)
      setError(null)
      // Find the statement in our loaded statements
      const statement = statements.find(s => s.id === statementId)
      if (statement) {
        // Parse the statement to extract update fields
        await handleAIParseFromText(statement.rawText, statement.sourceUrl || undefined)
        setSelectedStatementId(statementId)
        setViewMode('new') // Switch to new view to show parsed data
      } else {
        setError('Statement not found')
      }
    } catch (error: any) {
      console.error('Failed to load statement:', error)
      setError('Failed to load statement: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoadingStatements(false)
    }
  }

  async function handleAIParseFromText(text: string, sourceUrl?: string) {
    try {
      setParsing(true)
      setError(null)
      const response = await api.post('/api/utils/news-artifact/ingest', { 
        text: text,
        sourceUrl: sourceUrl || undefined,
        headline: text.split('\n')[0]?.substring(0, 200) || undefined,
      })

      if (response.data.success && response.data.data) {
        setReviewData(response.data.data)
        setAiText(text) // Set the text so user can see it
        setUrl(sourceUrl || '')
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
      
      // Step 1: Ingest and parse article (determines artifactType)
      const ingestResponse = await api.post('/api/utils/news-artifact/ingest', { 
        text: aiText,
        sourceUrl: url || undefined,
        headline: aiText.split('\n')[0]?.substring(0, 200) || undefined,
      })

      if (!ingestResponse.data.success) {
        setError('Failed to parse: ' + (ingestResponse.data.error || 'Unknown error'))
        return
      }

      const parsedData = ingestResponse.data.data
      
      // Step 2: Save as CompanyNewsArtifact (GLOBAL - company-level)
      const artifactResponse = await api.post('/api/utils/news-artifact/create', {
        rawText: parsedData.rawText,
        sourceUrl: parsedData.sourceUrl,
        headline: parsedData.headline,
        sourceName: parsedData.sourceName,
        aiSummary: parsedData.narrativeSummary,
        artifactType: parsedData.artifactType,
        sentiment: parsedData.sentiment,
        humanElements: parsedData.humanElements,
        noteworthyItems: parsedData.noteworthyItems,
        leaderStatement: parsedData.leadershipQuote ? {
          statement: parsedData.leadershipQuote,
          leader: parsedData.humanElements?.leaders?.[0] || null,
          role: null,
        } : null,
      })

      if (artifactResponse.data.success) {
        // Now we have the artifact saved globally
        // Set review data for creating unit update
        setReviewData(parsedData)
        setError(null)
      } else {
        setError('Failed to save artifact: ' + (artifactResponse.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to parse with AI:', error)
      setError('Failed to parse: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  async function handleCreateUpdate() {
    if (!reviewData) {
      setError('No data to save')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Create Update - statementId is OPTIONAL (bolt on for provenance)
      // Update can exist independently - only platformUnitId is required
      const response = await api.post('/api/company/products/platform/unit/update/create', {
        platformUnitId: unitId, // REQUIRED - update must belong to a unit
        // Optional: link to statement if we have one (provenance)
        statementId: selectedStatementId || null,
        rawText: selectedStatementId ? null : reviewData.rawText, // Only send rawText if creating new statement
        sourceUrl: reviewData.sourceUrl || null,
        // CompanyPlatformUnitUpdate fields (all optional)
        statusUpdate: reviewData.statusUpdate || null,
        percentComplete: reviewData.percentComplete || null,
        scheduleNote: reviewData.scheduleNote || null,
        industrialBaseNote: reviewData.industrialBaseNote || null,
        leadershipQuote: reviewData.leadershipQuote || null,
        keelLaidDate: reviewData.keelLaidDate || null,
        seaTrialsStartDate: reviewData.seaTrialsStartDate || null,
        deliveryDate: reviewData.deliveryDate || null,
        commissioningDate: reviewData.commissioningDate || null,
        narrativeSummary: reviewData.narrativeSummary || null,
        tags: reviewData.tags || [],
      })

      if (response.data.success) {
        setSuccess(true)
        // Reload statements to show the new one
        await loadStatements()
      } else {
        setError('Failed to create update: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create update:', error)
      setError('Failed to create update: ' + (error.response?.data?.error || error.message))
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-blue-600 mr-3" />
                  <h1 className="text-3xl font-bold text-gray-900">Add Update</h1>
                </div>
                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setViewMode('bank')
                      setReviewData(null)
                      setSelectedStatementId(null)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'bank'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Archive className="w-4 h-4 inline mr-2" />
                    Artifact Bank
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('new')
                      setReviewData(null)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'new'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    New Article
                  </button>
                </div>
              </div>

              {viewMode === 'bank' ? (
                /* Artifact Bank View */
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Article Bank</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Select an existing article to create an update from it, or add a new article.
                    </p>
                  </div>

                  {loadingStatements ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : statements.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <Archive className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">No articles yet</p>
                      <button
                        onClick={() => setViewMode('new')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        Add First Article
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {statements.map((statement) => (
                        <div
                          key={statement.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            selectedStatementId === statement.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectStatement(statement.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {statement.headline && (
                                <h3 className="font-medium text-gray-900 mb-1">{statement.headline}</h3>
                              )}
                              {statement.sourceName && (
                                <p className="text-sm text-gray-600 mb-2">{statement.sourceName}</p>
                              )}
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {statement.rawText.substring(0, 200)}...
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(statement.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {selectedStatementId === statement.id && (
                              <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : success ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <h2 className="text-xl font-semibold text-green-900">Update Created Successfully!</h2>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                      The update has been created from {selectedStatementId ? 'the selected article' : 'the new article'}.
                    </p>
                    <div className="flex items-center justify-end space-x-4">
                      <button
                        onClick={() => {
                          setSuccess(false)
                          setReviewData(null)
                          setSelectedStatementId(null)
                          setViewMode('bank')
                          loadStatements()
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Create Another Update
                      </button>
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
                  {/* Platform Unit Update Fields - Direct Mapping */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Unit Update</h2>
                    
                    <div className="space-y-4">
                      {/* Status Update */}
                      {reviewData.statusUpdate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status Update</label>
                          <input
                            type="text"
                            value={reviewData.statusUpdate}
                            onChange={(e) => setReviewData({ ...reviewData, statusUpdate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Builder's Trials, Sea Trials, Keel Laid"
                          />
                        </div>
                      )}

                      {/* Percent Complete */}
                      {reviewData.percentComplete !== null && reviewData.percentComplete !== undefined && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Percent Complete</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={reviewData.percentComplete}
                            onChange={(e) => setReviewData({ ...reviewData, percentComplete: parseInt(e.target.value) || null })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {/* Schedule Note */}
                      {reviewData.scheduleNote && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Note</label>
                          <textarea
                            rows={2}
                            value={reviewData.scheduleNote}
                            onChange={(e) => setReviewData({ ...reviewData, scheduleNote: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Delivery delayed from July 2025 to March 2027"
                          />
                        </div>
                      )}

                      {/* Industrial Base Note */}
                      {reviewData.industrialBaseNote && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industrial Base Note</label>
                          <textarea
                            rows={2}
                            value={reviewData.industrialBaseNote}
                            onChange={(e) => setReviewData({ ...reviewData, industrialBaseNote: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Technology integration challenges, supplier delays"
                          />
                        </div>
                      )}

                      {/* Leadership Quote */}
                      {reviewData.leadershipQuote && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Leadership Quote</label>
                          <textarea
                            rows={3}
                            value={reviewData.leadershipQuote}
                            onChange={(e) => setReviewData({ ...reviewData, leadershipQuote: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 italic"
                            placeholder="Quote from leadership"
                          />
                        </div>
                      )}

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        {reviewData.keelLaidDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Keel Laid Date</label>
                            <input
                              type="date"
                              value={reviewData.keelLaidDate}
                              onChange={(e) => setReviewData({ ...reviewData, keelLaidDate: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        {reviewData.seaTrialsStartDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sea Trials Start Date</label>
                            <input
                              type="date"
                              value={reviewData.seaTrialsStartDate}
                              onChange={(e) => setReviewData({ ...reviewData, seaTrialsStartDate: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        {reviewData.deliveryDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                            <input
                              type="date"
                              value={reviewData.deliveryDate}
                              onChange={(e) => setReviewData({ ...reviewData, deliveryDate: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        {reviewData.commissioningDate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Commissioning Date</label>
                            <input
                              type="date"
                              value={reviewData.commissioningDate}
                              onChange={(e) => setReviewData({ ...reviewData, commissioningDate: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Narrative Summary */}
                      {reviewData.narrativeSummary && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Narrative Summary</label>
                          <textarea
                            rows={4}
                            value={reviewData.narrativeSummary}
                            onChange={(e) => setReviewData({ ...reviewData, narrativeSummary: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="2-3 sentence summary"
                          />
                        </div>
                      )}

                      {/* Tags */}
                      {reviewData.tags && reviewData.tags.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {reviewData.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

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
                        onClick={handleCreateUpdate}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Creating Update...' : 'Create Unit Update'}
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
