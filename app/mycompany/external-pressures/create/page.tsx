'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { getAuth } from 'firebase/auth'
import { refreshWorkMe } from '@/lib/workme.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { AlertTriangle, ArrowLeft, Archive, Newspaper, FileText, Loader2, AlertCircle, Link as LinkIcon, Wand2, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

const PRESSURE_SOURCES = [
  { value: 'CONGRESS', label: 'Congress' },
  { value: 'EXECUTIVE_BRANCH', label: 'Executive Branch' },
  { value: 'OSD', label: 'DoW' },
  { value: 'NAVSEA_LEADERSHIP', label: 'NAVSEA Leadership' },
  { value: 'PEO', label: 'PEO' },
  { value: 'POLICY', label: 'Policy' },
  { value: 'BUDGET', label: 'Budget' },
  { value: 'GAO', label: 'GAO' },
  { value: 'INDUSTRY', label: 'Industry' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'CYBER', label: 'Cyber' },
] as const

const WORKFORCE_CONCERNS = [
  { value: 'JOB_SECURITY', label: 'Job Security - "Will I still have a job?"' },
  { value: 'ROLE_CLARITY', label: 'Role Clarity - "What is my role / does it still matter?"' },
  { value: 'FAIRNESS', label: 'Fairness - "Is the burden shared equitably?"' },
  { value: 'ADMIN_FRICTION', label: 'Admin Friction - "Why is it harder to do my job?"' },
  { value: 'TRUST_CREDIBILITY', label: 'Trust & Credibility - "Do leadership actions match reality?"' },
] as const

const SEVERITY_LABELS = [
  'Informational / Low Concern',
  'Mild Background Concern',
  'Noticeable but Contained',
  'Disruptive to Focus or Planning',
  'High Anxiety / Widespread Concern',
  'Existential (Job, Identity, Trust at Risk)',
] as const

interface NewsArtifact {
  id: string
  headline: string | null
  sourceName: string | null
  sourceUrl: string | null
  createdAt: string
}

function CreateExternalCompanyPressurePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIngest, setShowIngest] = useState(false)
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null)
  const [newsArtifacts, setNewsArtifacts] = useState<NewsArtifact[]>([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(false)
  const [formData, setFormData] = useState({
    source: 'CONGRESS', // Default to Congress (most common)
    title: '',
    summary: '',
    impact: '',
    workforceConcern: 'JOB_SECURITY',
    levelOfSeverity: 2,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if coming from article ingest
    const artifactId = searchParams?.get('artifactId')
    if (artifactId) {
      setSelectedArtifactId(artifactId)
      loadAndParseArtifact(artifactId)
    }

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

  async function loadNewsArtifacts() {
    try {
      setLoadingArtifacts(true)
      const response = await api.get('/api/utils/news-artifact/list?limit=10')
      if (response.data.success && response.data.data) {
        setNewsArtifacts(response.data.data.artifacts || [])
      }
    } catch (error: any) {
      console.error('Failed to load news artifacts:', error)
    } finally {
      setLoadingArtifacts(false)
    }
  }

  async function loadAndParseArtifact(artifactId: string) {
    try {
      setParsing(true)
      setSelectedArtifactId(artifactId)
      
      // Parse article as external_env to get structured data
      const response = await api.post('/api/utils/news-artifact/parse', {
        artifactId: artifactId,
        modelType: 'external_env',
      })

      if (response.data.success && response.data.data) {
        const parsed = response.data.data
        
        // Get artifact details for headline
        const artifactResponse = await api.get(`/api/utils/news-artifact/${artifactId}`)
        const artifact = artifactResponse.data.data
        
        // Map external_env fields to external pressure fields
        setFormData({
          source: parsed.source || '',
          title: artifact?.headline || parsed.summary?.substring(0, 100) || '',
          summary: parsed.summary || '',
          impact: parsed.impact || '',
          workforceConcern: 'JOB_SECURITY',
          levelOfSeverity: 2,
        })
        
        setShowIngest(false) // Hide ingest section after parsing
      }
    } catch (error: any) {
      console.error('Failed to parse artifact:', error)
      alert('Failed to parse article: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  async function handleFetchUrl() {
    if (!url.trim()) {
      alert('Please enter a URL')
      return
    }

    try {
      setFetching(true)
      setError(null)

      const response = await api.post('/api/utils/fetch-article', { url: url.trim() })

      if (response.data.success && response.data.data) {
        const article = response.data.data
        setText(article.textContent || article.content || '')
        setUrl(article.url || url)
      } else {
        if (response.data.requiresManualPaste) {
          alert(response.data.error || 'Could not extract article. Please paste the content manually.')
          setInputMode('text')
        } else {
          alert(response.data.error || 'Failed to fetch article')
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch article:', error)
      if (error.response?.data?.requiresManualPaste) {
        alert(error.response.data.error || 'Could not extract article. Please paste the content manually.')
        setInputMode('text')
      } else {
        alert(error.response?.data?.error || error.message || 'Failed to fetch article')
      }
    } finally {
      setFetching(false)
    }
  }

  async function handleIngestArticle() {
    const textToIngest = text.trim()
    if (!textToIngest) {
      alert('Please provide article text (either via URL or paste)')
      return
    }

    try {
      setParsing(true)
      setError(null)

      // Step 1: Ingest and analyze article
      const ingestResponse = await api.post('/api/utils/news-artifact/ingest', {
        text: textToIngest,
        sourceUrl: url || null,
        headline: textToIngest.split('\n')[0]?.substring(0, 200) || null,
        sourceName: url ? new URL(url).hostname.replace('www.', '') : null,
      })

      if (!ingestResponse.data.success) {
        throw new Error(ingestResponse.data.error || 'Failed to ingest article')
      }

      const ingestData = ingestResponse.data.data

      // Step 2: Create artifact
      const createResponse = await api.post('/api/utils/news-artifact/create', {
        sourceUrl: url || null,
        sourceName: url ? new URL(url).hostname.replace('www.', '') : null,
        headline: ingestData.headline || textToIngest.split('\n')[0]?.substring(0, 200),
        rawText: textToIngest,
        aiSummary: ingestData.narrativeSummary || null,
        artifactType: ingestData.artifactType || null,
        sentiment: ingestData.sentiment || null,
        humanElements: ingestData.humanElements || null,
        noteworthyItems: ingestData.noteworthyItems || null,
      })

      if (!createResponse.data.success) {
        throw new Error(createResponse.data.error || 'Failed to create artifact')
      }

      const artifactId = createResponse.data.data.id

      // Step 3: Parse as external_env
      const parseResponse = await api.post('/api/utils/news-artifact/parse', {
        artifactId: artifactId,
        modelType: 'external_env',
      })

      if (parseResponse.data.success && parseResponse.data.data) {
        const parsed = parseResponse.data.data
        
        // Map to form fields
        setFormData({
          source: parsed.source || '',
          title: ingestData.headline || parsed.summary?.substring(0, 100) || '',
          summary: parsed.summary || '',
          impact: parsed.impact || '',
          workforceConcern: 'JOB_SECURITY',
          levelOfSeverity: 2,
        })
        
        setSelectedArtifactId(artifactId)
        setShowIngest(false) // Hide ingest section
        setText('') // Clear input
        setUrl('') // Clear URL
      }
    } catch (error: any) {
      console.error('Failed to ingest article:', error)
      alert('Failed to ingest article: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workMeId) return

    // Source is required but has default, so this check is still good
    if (!formData.source) {
      alert('Please select a source')
      return
    }

    try {
      setLoading(true)
      const payload = {
        ...formData,
        source: formData.source as any, // Type assertion for enum
      }
      
      const response = await api.post('/api/external-pressures/create', payload)
      
      if (response.data.success) {
        router.push(`/mycompany/external-pressures/${response.data.pressure.id}`)
      } else {
        console.error('Failed to create pressure:', response.data.error)
        alert('Failed to create pressure: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create pressure:', error)
      alert('Failed to create pressure: ' + (error.response?.data?.error || error.message))
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/mycompany/external-pressures"
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to External Pressures
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Create External Company Pressure</h1>
              </div>

              {/* Ingest Article Section - Prominent */}
              {showIngest && (
                <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Newspaper className="h-5 w-5 mr-2 text-blue-600" />
                      Ingest Article
                    </h2>
                    <button
                      onClick={() => {
                        setShowIngest(false)
                        setText('')
                        setUrl('')
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Paste an article URL or text to automatically parse and pre-fill the form.
                  </p>

                  {/* Input Mode Toggle */}
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => {
                        setInputMode('url')
                        setText('')
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
                        setUrl('')
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
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input
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
                  )}

                  {/* Text Input */}
                  <div className="mb-4">
                    <textarea
                      rows={6}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={inputMode === 'url' ? 'Click "Fetch" to load article content...' : 'Paste article text here...'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      disabled={fetching || parsing}
                    />
                    {text && (
                      <p className="text-sm text-gray-500 mt-2">
                        {text.length} characters
                      </p>
                    )}
                  </div>

                  {/* Quick Select from Recent Artifacts */}
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        if (!loadingArtifacts && newsArtifacts.length === 0) {
                          loadNewsArtifacts()
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      {newsArtifacts.length === 0 ? 'Select from recent articles' : 'Hide recent articles'}
                    </button>
                    {newsArtifacts.length > 0 && (
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {newsArtifacts.map((artifact) => (
                          <button
                            key={artifact.id}
                            onClick={() => loadAndParseArtifact(artifact.id)}
                            disabled={parsing}
                            className="w-full text-left p-2 border border-gray-200 rounded hover:bg-blue-50 text-sm disabled:opacity-50"
                          >
                            {artifact.headline || artifact.sourceName || '(Untitled)'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ingest Button */}
                  <button
                    onClick={handleIngestArticle}
                    disabled={parsing || !text.trim()}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {parsing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Parsing Article...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Parse & Pre-fill Form
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Show Ingest Button if not already showing */}
              {!showIngest && !selectedArtifactId && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setShowIngest(true)
                      loadNewsArtifacts()
                    }}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Newspaper className="w-5 h-5 mr-2" />
                    Ingest Article to Auto-fill Form
                  </button>
                </div>
              )}

              {/* Success Message */}
              {selectedArtifactId && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    Article parsed successfully! Review and edit the fields below, then save.
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                    Source * <span className="text-red-500">(Required)</span>
                  </label>
                  <select
                    id="source"
                    required
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PRESSURE_SOURCES.map(source => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                  {selectedArtifactId && (
                    <p className="text-xs text-blue-600 mt-1">
                      ✓ Parsed from article - you can edit any field
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., PAE Realignment, Budget / CR Uncertainty"
                  />
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                    Summary *
                  </label>
                  <textarea
                    id="summary"
                    rows={4}
                    required
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What is happening..."
                  />
                </div>

                <div>
                  <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-2">
                    Impact
                  </label>
                  <textarea
                    id="impact"
                    rows={3}
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Why it matters to work..."
                  />
                </div>

                <div>
                  <label htmlFor="workforceConcern" className="block text-sm font-medium text-gray-700 mb-2">
                    Workforce Concern *
                  </label>
                  <select
                    id="workforceConcern"
                    required
                    value={formData.workforceConcern}
                    onChange={(e) => setFormData({ ...formData, workforceConcern: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {WORKFORCE_CONCERNS.map(concern => (
                      <option key={concern.value} value={concern.value}>{concern.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="levelOfSeverity" className="block text-sm font-medium text-gray-700 mb-2">
                    Level of Severity: {formData.levelOfSeverity}/5 - {SEVERITY_LABELS[formData.levelOfSeverity]} *
                  </label>
                  <input
                    type="range"
                    id="levelOfSeverity"
                    min="0"
                    max="5"
                    required
                    value={formData.levelOfSeverity}
                    onChange={(e) => setFormData({ ...formData, levelOfSeverity: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 - Low</span>
                    <span>5 - Critical</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Link
                    href="/mycompany/external-pressures"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Pressure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CreateExternalCompanyPressurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CreateExternalCompanyPressurePageContent />
    </Suspense>
  )
}
