'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Newspaper, Archive, Wand2, Loader2, Filter, Plus, ArrowRight } from 'lucide-react'

interface Artifact {
  id: string
  headline: string | null
  sourceName: string | null
  sourceUrl: string | null
  artifactType: string | null
  sentiment: string | null
  aiSummary: string | null
  rawText: string
  createdAt: string
  humanElements: any
  noteworthyItems: any
}

export default function ArticlesPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSentiment, setFilterSentiment] = useState<string>('all')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
    }
  }, [router])

  useEffect(() => {
    if (workMeId) {
      loadArtifacts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workMeId, filterType, filterSentiment])

  async function loadArtifacts() {
    if (!workMeId) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('artifactType', filterType)
      if (filterSentiment !== 'all') params.append('sentiment', filterSentiment)
      
      console.log('[ArticlesPage] Loading artifacts with params:', params.toString())
      const response = await api.get(`/api/utils/news-artifact/list?${params.toString()}`)
      
      console.log('[ArticlesPage] API response:', {
        success: response.data.success,
        artifactsCount: response.data.data?.artifacts?.length || 0,
        total: response.data.data?.total || 0,
      })
      
      if (response.data.success && response.data.data) {
        setArtifacts(response.data.data.artifacts || [])
      } else {
        console.error('Failed to load artifacts:', response.data.error)
        setArtifacts([])
      }
    } catch (error: any) {
      console.error('Failed to load artifacts:', error)
      console.error('Error details:', error.response?.data || error.message)
      setArtifacts([])
      // Don't show error to user, just log it
    } finally {
      setLoading(false)
    }
  }

  function getRouteForArtifact(artifact: Artifact) {
    // Always route to parse page - let user choose what to parse it as
    // The parse page has a model type selector dropdown (similar to workforcestuff)
    return `/signal/clip/${artifact.id}/parse`
  }

  if (!workMeId || loading) {
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Global Artifacts</h1>
                <p className="text-gray-600 mt-2">
                  All articles and news artifacts. Parse to determine what they're about (company, product, unit, leader, process), then create appropriate records.
                </p>
              </div>
              <Link
                href="/signal/clip"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-gray-500" />
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="unit_update">Unit Update</option>
                      <option value="milestone">Milestone</option>
                      <option value="external_pressure">External Pressure</option>
                      <option value="workforce">Workforce</option>
                      <option value="platform">Platform</option>
                      <option value="leadership">Leadership</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sentiment</label>
                    <select
                      value={filterSentiment}
                      onChange={(e) => setFilterSentiment(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Sentiments</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Artifacts List */}
            {artifacts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Articles Yet</h3>
                <p className="text-gray-600 mb-6">Start by adding articles from Signals or manually.</p>
                <Link
                  href="/signal/clip"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Article
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {artifact.headline && (
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{artifact.headline}</h3>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          {artifact.sourceName && (
                            <span className="text-sm text-gray-600">{artifact.sourceName}</span>
                          )}
                          {artifact.artifactType && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {artifact.artifactType.replace('_', ' ')}
                            </span>
                          )}
                          {artifact.sentiment && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              artifact.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                              artifact.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {artifact.sentiment}
                            </span>
                          )}
                        </div>
                        {artifact.aiSummary && (
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{artifact.aiSummary}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(artifact.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Link
                          href={getRouteForArtifact(artifact)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Parse & Route
                        </Link>
                        <Link
                          href={`/signal/clip/${artifact.id}`}
                          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
