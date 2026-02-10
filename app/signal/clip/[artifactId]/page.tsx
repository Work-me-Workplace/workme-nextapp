'use client'

import Link from 'next/link'
import { use, useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Newspaper, ArrowLeft, Wand2, ExternalLink, Loader2, Edit2, Save, X, FolderOpen } from 'lucide-react'

function normalizeArticleText(text: string): string {
  if (!text) return text
  let normalized = text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ')
  const lines = normalized.split('\n').map((line: string) => line.trim())
  const cleanedLines: string[] = []
  let lastWasEmpty = false
  for (const line of lines) {
    if (line === '') {
      if (!lastWasEmpty) {
        cleanedLines.push('')
        lastWasEmpty = true
      }
    } else {
      cleanedLines.push(line)
      lastWasEmpty = false
    }
  }
  return cleanedLines.join('\n').trim()
}

interface CategoryOption {
  id: string
  name: string
  description: string | null
  color: string | null
}

interface NewsArtifact {
  id: string
  headline: string | null
  rawText: string
  sourceUrl: string | null
  sourceName: string | null
  artifactType: string | null
  categoryId: string | null
  category: { id: string; name: string; description: string | null; color: string | null } | null
  createdAt: string
}

function ClipViewContent({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [artifact, setArtifact] = useState<NewsArtifact | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [editing, setEditing] = useState(false)
  const [editHeadline, setEditHeadline] = useState('')
  const [editRawText, setEditRawText] = useState('')
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

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
            if (refreshed) id = refreshed.id
          } catch (e) {
            console.error('Failed to refresh WorkMe:', e)
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
    if (!authReady || !workMeId || !artifactId) return
    loadArtifact()
    loadCategories()
  }, [authReady, workMeId, artifactId])

  async function loadCategories() {
    try {
      const res = await api.get('/api/article-category/list')
      if (res.data.success && res.data.data?.categories) {
        setCategories(res.data.data.categories)
      }
    } catch (e) {
      console.error('Failed to load categories', e)
    }
  }

  async function loadArtifact() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/utils/news-artifact/${artifactId}`)
      if (response.data.success && response.data.data) {
        const data = response.data.data
        setArtifact(data)
        setEditHeadline(data.headline || '')
        setEditRawText(data.rawText || '')
        setEditCategoryId(data.categoryId || null)
      } else {
        setError(response.data.error || 'Article not found')
      }
    } catch (err: any) {
      console.error('Failed to load article:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!artifact) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await api.patch(`/api/utils/news-artifact/${artifactId}`, {
        headline: editHeadline.trim() || null,
        rawText: normalizeArticleText(editRawText),
        categoryId: editCategoryId || '',
      })
      if (res.data.success && res.data.data) {
        setArtifact((prev) => (prev ? { ...prev, ...res.data.data } : null))
        setEditing(false)
      } else {
        setSaveError(res.data.error || 'Failed to save')
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.error || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    if (artifact) {
      setEditHeadline(artifact.headline || '')
      setEditRawText(artifact.rawText || '')
      setEditCategoryId(artifact.categoryId || null)
    }
    setEditing(false)
    setSaveError(null)
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return
    setAddingCategory(true)
    setSaveError(null)
    try {
      const res = await api.post('/api/article-category/create', {
        name: newCategoryName.trim(),
      })
      if (res.data.success && res.data.data) {
        setCategories((prev) => [...prev, res.data.data])
        setEditCategoryId(res.data.data.id)
        setNewCategoryName('')
      } else {
        setSaveError(res.data.error || 'Failed to create category')
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.error || err.message || 'Failed to create category')
    } finally {
      setAddingCategory(false)
    }
  }

  if (!authReady || !workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
              href="/mycompany/articles"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Global Artifacts
            </Link>

            <div className="bg-white rounded-lg shadow-md p-8">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                  <Link href="/mycompany/articles" className="mt-2 inline-block text-sm text-red-600 hover:underline">
                    ← Back to Global Artifacts
                  </Link>
                </div>
              ) : artifact ? (
                <>
                  <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
                    <div className="flex items-center">
                      <Newspaper className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Article</h1>
                        <p className="text-sm text-gray-500">
                          {new Date(artifact.createdAt).toLocaleDateString()}
                          {artifact.sourceName && ` · ${artifact.sourceName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <Link
                            href={`/signal/clip/${artifactId}/parse`}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Parse & Route
                          </Link>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Save
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {saveError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      {saveError}
                    </div>
                  )}

                  {/* Category: pick or create. API: POST /api/article-category/create */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <FolderOpen className="w-4 h-4" />
                      Category
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Pick a category or create one below. One per article (e.g. Shipbuilding, Congress). Use <strong>Parse & Route</strong> to create a Workforce or External Pressure record.
                    </p>
                    {editing ? (
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-600">Pick existing</label>
                        <select
                          value={editCategoryId || ''}
                          onChange={(e) => setEditCategoryId(e.target.value === '' ? null : e.target.value)}
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">No category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <label className="block text-xs text-gray-600 mt-2">Or create new</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Shipbuilding, Portfolio Acquisition Executive"
                            className="flex-1 max-w-xs px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={addingCategory || !newCategoryName.trim()}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
                          >
                            {addingCategory ? 'Adding...' : 'Create category'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {artifact.category ? (
                          <span
                            className="px-2 py-1 rounded text-sm font-medium text-white"
                            style={{ backgroundColor: artifact.category.color || '#6B7280' }}
                          >
                            {artifact.category.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Headline */}
                  <div className="mb-4">
                    {editing ? (
                      <>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Headline / Title
                        </label>
                        <input
                          type="text"
                          value={editHeadline}
                          onChange={(e) => setEditHeadline(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                          placeholder="Article headline..."
                        />
                      </>
                    ) : (
                      artifact.headline && (
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">{artifact.headline}</h2>
                      )
                    )}
                  </div>

                  {artifact.sourceUrl && (
                    <p className="mb-4">
                      <a
                        href={artifact.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {artifact.sourceUrl}
                      </a>
                    </p>
                  )}

                  {artifact.artifactType && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium mb-4">
                      {artifact.artifactType.replace('_', ' ')}
                    </span>
                  )}

                  {/* Article text */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Article text</p>
                    {editing ? (
                      <textarea
                        value={editRawText}
                        onChange={(e) => setEditRawText(e.target.value)}
                        rows={14}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm whitespace-pre-wrap"
                        placeholder="Article content..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-mono text-sm">
                        {artifact.rawText}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {editing ? editRawText.length : artifact.rawText.length} characters
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ClipViewPage({ params }: { params: Promise<{ artifactId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <ClipViewContent params={params} />
    </Suspense>
  )
}
