'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { FileText, Archive, Newspaper, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

interface NewsArtifact {
  id: string
  headline: string | null
  sourceName: string | null
  sourceUrl: string | null
  createdAt: string
}

export default function CreateExternalEnvPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [method, setMethod] = useState<'from-artifact' | 'manual' | 'clip-parser' | null>(null)
  const [newsArtifacts, setNewsArtifacts] = useState<NewsArtifact[]>([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    source: '',
    category: '',
    summary: '',
    impact: '',
    deltaSummary: '',
    implementationTimeline: '',
    leadAuthority: '',
    confidenceLevel: '',
    timeHorizon: '',
  })

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

  useEffect(() => {
    if (method === 'from-artifact' && workMeId) {
      loadNewsArtifacts()
    }
  }, [method, workMeId])

  async function loadNewsArtifacts() {
    try {
      setLoadingArtifacts(true)
      const response = await api.get('/api/utils/news-artifact/list')
      if (response.data.success && response.data.artifacts) {
        setNewsArtifacts(response.data.artifacts)
      }
    } catch (error: any) {
      console.error('Failed to load news artifacts:', error)
    } finally {
      setLoadingArtifacts(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workMeId) return

    try {
      setLoading(true)
      setError(null)

      const response = await api.post('/api/company/external-env/create', {
        source: formData.source,
        category: formData.category || null,
        summary: formData.summary,
        impact: formData.impact || null,
        deltaSummary: formData.deltaSummary || null,
        implementationTimeline: formData.implementationTimeline || null,
        leadAuthority: formData.leadAuthority || null,
        confidenceLevel: formData.confidenceLevel || null,
        timeHorizon: formData.timeHorizon || null,
      })

      if (response.data.success && response.data.data) {
        router.push(`/mycompany/external-env/${response.data.data.id}`)
      } else {
        setError(response.data.error || 'Failed to create external environment')
      }
    } catch (error: any) {
      console.error('Failed to create external environment:', error)
      setError(error.response?.data?.error || error.message || 'Failed to create external environment')
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
            <Link href="/mycompany" className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Company
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create External Environment</h1>
              <p className="text-gray-600 mt-2">Choose how you want to create this external environment signal</p>
            </div>

            {!method ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setMethod('from-artifact')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <Archive className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">From News Artifact</h3>
                  <p className="text-sm text-gray-600">Select from stored news articles and parse</p>
                </button>

                <button
                  onClick={() => setMethod('manual')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <FileText className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Entry</h3>
                  <p className="text-sm text-gray-600">Enter details manually</p>
                </button>

                <button
                  onClick={() => setMethod('clip-parser')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <Newspaper className="h-8 w-8 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">From Clip Parser</h3>
                  <p className="text-sm text-gray-600">Create new article and parse</p>
                </button>
              </div>
            ) : method === 'clip-parser' ? (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6">
                  <button
                    onClick={() => setMethod(null)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Choose Different Method
                  </button>
                </div>
                <div className="text-center py-12">
                  <Newspaper className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Create from Clip Parser</h2>
                  <p className="text-gray-600 mb-6">Go to the Clip Parser to create a new news artifact and parse it into an External Environment.</p>
                  <Link
                    href="/signal/clip"
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    Open Clip Parser
                  </Link>
                </div>
              </div>
            ) : method === 'from-artifact' ? (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6">
                  <button
                    onClick={() => setMethod(null)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Choose Different Method
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select News Artifact</h2>
                
                {loadingArtifacts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : newsArtifacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No news artifacts found.</p>
                    <Link
                      href="/signal/clip"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Create a news artifact first
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newsArtifacts.map((artifact) => (
                      <button
                        key={artifact.id}
                        onClick={() => router.push(`/signal/clip/${artifact.id}/parse?modelType=external_env`)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                      >
                        <div className="font-medium text-gray-900">
                          {artifact.headline || artifact.sourceName || '(Untitled)'}
                        </div>
                        {artifact.sourceName && (
                          <div className="text-sm text-gray-500 mt-1">{artifact.sourceName}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(artifact.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setMethod(null)
                      setError(null)
                      setFormData({
                        source: '',
                        category: '',
                        summary: '',
                        impact: '',
                        deltaSummary: '',
                        implementationTimeline: '',
                        leadAuthority: '',
                        confidenceLevel: '',
                        timeHorizon: '',
                      })
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Choose Different Method
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Manual Entry</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Signal Basics</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Source <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., GAO, Congress, Industry, DoD, Navy"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., Budget, Legislation, Testing, Ops, Regulatory"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Summary <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={formData.summary}
                          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Description of the external signal/development..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Impact</label>
                        <textarea
                          rows={3}
                          value={formData.impact}
                          onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Why this matters, what it means, significance..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Intelligence</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delta Summary</label>
                        <textarea
                          rows={3}
                          value={formData.deltaSummary}
                          onChange={(e) => setFormData({ ...formData, deltaSummary: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="What materially changed vs prior state..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Timeline</label>
                        <input
                          type="text"
                          value={formData.implementationTimeline}
                          onChange={(e) => setFormData({ ...formData, implementationTimeline: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="When this starts to matter..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lead Authority</label>
                        <input
                          type="text"
                          value={formData.leadAuthority}
                          onChange={(e) => setFormData({ ...formData, leadAuthority: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Who owns/drives this change..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confidence Level</label>
                        <select
                          value={formData.confidenceLevel}
                          onChange={(e) => setFormData({ ...formData, confidenceLevel: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select...</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Horizon</label>
                        <select
                          value={formData.timeHorizon}
                          onChange={(e) => setFormData({ ...formData, timeHorizon: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Select...</option>
                          <option value="immediate">Immediate</option>
                          <option value="near-term">Near-term</option>
                          <option value="long-term">Long-term</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setMethod(null)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create External Environment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
