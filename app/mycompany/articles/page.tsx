'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Newspaper, Archive, Wand2, Loader2, Filter, Plus, ArrowRight, Trash2, AlertCircle } from 'lucide-react'

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
  categoryId: string | null
  category: {
    id: string
    name: string
    description: string | null
    color: string | null
  } | null
}

export default function ArticlesPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showUnassignedFirst, setShowUnassignedFirst] = useState(true)
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description: string | null; color: string | null }>>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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
      loadCategories()
      loadArtifacts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workMeId, filterType, filterCategory])

  async function loadCategories() {
    try {
      const response = await api.get('/api/article-category/list')
      if (response.data.success && response.data.data) {
        setCategories(response.data.data.categories || [])
      }
    } catch (error: any) {
      console.error('Failed to load categories:', error)
    }
  }

  async function loadArtifacts() {
    if (!workMeId) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('artifactType', filterType)
      
      // For "unassigned", we'll filter client-side since API doesn't support null filtering yet
      // For specific category, use categoryId filter
      if (filterCategory !== 'all' && filterCategory !== 'unassigned') {
        params.append('categoryId', filterCategory)
      }
      
      console.log('[ArticlesPage] Loading artifacts with params:', params.toString())
      const response = await api.get(`/api/utils/news-artifact/list?${params.toString()}`)
      
      console.log('[ArticlesPage] API response:', {
        success: response.data.success,
        artifactsCount: response.data.data?.artifacts?.length || 0,
        total: response.data.data?.total || 0,
      })
      
      if (response.data.success && response.data.data) {
        let artifactsList = response.data.data.artifacts || []
        
        // Filter for unassigned if needed
        if (filterCategory === 'unassigned') {
          artifactsList = artifactsList.filter(a => !a.categoryId)
        }
        
        // Sort: unassigned (no category) first if showUnassignedFirst is true and not filtering by category
        if (showUnassignedFirst && filterCategory === 'all') {
          artifactsList = artifactsList.sort((a, b) => {
            // Unassigned (no category) first
            if (!a.categoryId && b.categoryId) return -1
            if (a.categoryId && !b.categoryId) return 1
            return 0
          })
        }
        
        setArtifacts(artifactsList)
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

  async function handleDelete(artifactId: string) {
    if (!workMeId) return

    try {
      setDeletingId(artifactId)
      const response = await api.delete(`/api/utils/news-artifact/${artifactId}`)
      
      if (response.data.success) {
        // Remove from local state
        setArtifacts(artifacts.filter(a => a.id !== artifactId))
        setDeleteConfirmId(null)
      } else {
        alert('Failed to delete article: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to delete article:', error)
      alert('Failed to delete article: ' + (error.response?.data?.error || error.message || 'Unknown error'))
    } finally {
      setDeletingId(null)
    }
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
                <div className="flex gap-4 flex-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Workflow Type</label>
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
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="unassigned">Unassigned</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {filterCategory === 'all' && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showUnassignedFirst"
                    checked={showUnassignedFirst}
                    onChange={(e) => {
                      setShowUnassignedFirst(e.target.checked)
                      loadArtifacts()
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showUnassignedFirst" className="text-xs text-gray-600">
                    Show unassigned articles first
                  </label>
                </div>
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-start mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Article?</h3>
                      <p className="text-sm text-gray-600">
                        Are you sure you want to delete this article? This action cannot be undone.
                      </p>
                      {artifacts.find(a => a.id === deleteConfirmId)?.headline && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          "{artifacts.find(a => a.id === deleteConfirmId)?.headline}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
                      disabled={deletingId === deleteConfirmId}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirmId)}
                      disabled={deletingId === deleteConfirmId}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {deletingId === deleteConfirmId ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {artifact.sourceName && (
                            <span className="text-sm text-gray-600">{artifact.sourceName}</span>
                          )}
                          {artifact.artifactType && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {artifact.artifactType.replace('_', ' ')}
                            </span>
                          )}
                          {artifact.category ? (
                            <span 
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: artifact.category.color || '#6B7280' }}
                            >
                              {artifact.category.name}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                              Unassigned
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
                        <button
                          onClick={() => setDeleteConfirmId(artifact.id)}
                          disabled={deletingId === artifact.id}
                          className="flex items-center px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete article"
                        >
                          {deletingId === artifact.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
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
