'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { ArrowLeft, Sparkles, Save, Edit2, Trash2, Check, X } from 'lucide-react'

interface ConceptDraft {
  id: string
  title: string
  summary?: string | null
  howItWorks?: string | null
  whoImpacted: string[]
  example?: string | null
  timeframe?: string | null
  potentialStart?: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export default function ConceptDrafterPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<ConceptDraft[]>([])
  
  // Brain dump state
  const [brainDump, setBrainDump] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedDraft, setGeneratedDraft] = useState<Partial<ConceptDraft> | null>(null)
  const [isEditingGenerated, setIsEditingGenerated] = useState(false)
  
  // Edit state
  const [editingDraft, setEditingDraft] = useState<ConceptDraft | null>(null)
  const [editForm, setEditForm] = useState<Partial<ConceptDraft>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadDrafts()
      }
    }
  }, [router])

  async function loadDrafts() {
    try {
      setLoading(true)
      const response = await api.get('/api/concept-draft')
      if (response.data.success) {
        setDrafts(response.data.drafts || [])
      }
    } catch (error) {
      console.error('Failed to load drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!brainDump.trim()) {
      alert('Please enter your idea first')
      return
    }

    setGenerating(true)
    try {
      const response = await api.post('/api/concept-draft/generate', {
        brainDump: brainDump.trim(),
      })

      if (response.data.success) {
        setGeneratedDraft(response.data.conceptDraft)
        setIsEditingGenerated(false)
      } else {
        alert('Failed to generate: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to generate:', error)
      alert('Failed to generate: ' + (error.response?.data?.error || error.message))
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveGenerated() {
    if (!generatedDraft?.title) {
      alert('Title is required')
      return
    }

    try {
      const response = await api.post('/api/concept-draft', generatedDraft)
      if (response.data.success) {
        setBrainDump('')
        setGeneratedDraft(null)
        setIsEditingGenerated(false)
        loadDrafts()
      }
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert('Failed to save: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleConfirmDraft(draftId: string) {
    try {
      await api.put(`/api/concept-draft/${draftId}`, { status: 'CONFIRMED' })
      loadDrafts()
    } catch (error: any) {
      console.error('Failed to confirm:', error)
      alert('Failed to confirm draft')
    }
  }

  function startEdit(draft: ConceptDraft) {
    setEditingDraft(draft)
    setEditForm({
      title: draft.title,
      summary: draft.summary || '',
      howItWorks: draft.howItWorks || '',
      whoImpacted: draft.whoImpacted || [],
      example: draft.example || '',
      timeframe: draft.timeframe || '',
      potentialStart: draft.potentialStart || '',
    })
  }

  async function handleSaveEdit() {
    if (!editingDraft || !editForm.title) {
      return
    }

    try {
      const response = await api.put(`/api/concept-draft/${editingDraft.id}`, editForm)
      if (response.data.success) {
        setEditingDraft(null)
        setEditForm({})
        loadDrafts()
      }
    } catch (error: any) {
      console.error('Failed to update:', error)
      alert('Failed to update: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleDelete(draftId: string) {
    if (!confirm('Delete this concept draft?')) {
      return
    }

    try {
      await api.delete(`/api/concept-draft/${draftId}`)
      loadDrafts()
    } catch (error: any) {
      console.error('Failed to delete:', error)
      alert('Failed to delete draft')
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
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
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
            <div className="mb-8">
              <Link
                href="/mywork/plans"
                className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Plans
              </Link>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Concept Drafter</h1>
                <p className="text-gray-600 mt-2">Capture and structure your ideas before they become plans</p>
              </div>
            </div>

            {/* Brain Dump Input */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Start with a Brain Dump</h2>
              <textarea
                value={brainDump}
                onChange={(e) => setBrainDump(e.target.value)}
                placeholder="Type your idea here... What's the concept? Who would it impact? When might it happen?"
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !brainDump.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{generating ? 'Generating...' : 'Generate Concept Draft'}</span>
                </button>
              </div>
            </div>

            {/* Generated Draft */}
            {generatedDraft && (
              <div className="bg-white rounded-lg shadow p-6 mb-8 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Generated Concept Draft</h2>
                  <button
                    onClick={() => setIsEditingGenerated(!isEditingGenerated)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {isEditingGenerated ? 'Cancel Edit' : 'Edit'}
                  </button>
                </div>

                {isEditingGenerated ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={generatedDraft.title || ''}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                      <textarea
                        value={generatedDraft.summary || ''}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, summary: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">How It Works</label>
                      <textarea
                        value={generatedDraft.howItWorks || ''}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, howItWorks: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Who Impacted (one per line)</label>
                      <textarea
                        value={(generatedDraft.whoImpacted || []).join('\n')}
                        onChange={(e) => setGeneratedDraft({ 
                          ...generatedDraft, 
                          whoImpacted: e.target.value.split('\n').filter(Boolean) 
                        })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Example</label>
                      <textarea
                        value={generatedDraft.example || ''}
                        onChange={(e) => setGeneratedDraft({ ...generatedDraft, example: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                        <input
                          type="text"
                          value={generatedDraft.timeframe || ''}
                          onChange={(e) => setGeneratedDraft({ ...generatedDraft, timeframe: e.target.value })}
                          placeholder="e.g. FY25, Next 6–12 months"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Potential Start</label>
                        <input
                          type="text"
                          value={generatedDraft.potentialStart || ''}
                          onChange={(e) => setGeneratedDraft({ ...generatedDraft, potentialStart: e.target.value })}
                          placeholder="e.g. Post-town hall, Q2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{generatedDraft.title}</h3>
                      {generatedDraft.summary && (
                        <p className="text-gray-700 mt-2">{generatedDraft.summary}</p>
                      )}
                    </div>
                    {generatedDraft.howItWorks && (
                      <div>
                        <h4 className="font-medium text-gray-900">How It Works</h4>
                        <p className="text-gray-700 mt-1">{generatedDraft.howItWorks}</p>
                      </div>
                    )}
                    {generatedDraft.whoImpacted && generatedDraft.whoImpacted.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900">Who Impacted</h4>
                        <ul className="list-disc list-inside text-gray-700 mt-1">
                          {generatedDraft.whoImpacted.map((who, i) => (
                            <li key={i}>{who}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {generatedDraft.example && (
                      <div>
                        <h4 className="font-medium text-gray-900">Example</h4>
                        <p className="text-gray-700 mt-1">{generatedDraft.example}</p>
                      </div>
                    )}
                    <div className="flex space-x-4 text-sm text-gray-600">
                      {generatedDraft.timeframe && (
                        <span>Timeframe: {generatedDraft.timeframe}</span>
                      )}
                      {generatedDraft.potentialStart && (
                        <span>Potential Start: {generatedDraft.potentialStart}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setGeneratedDraft(null)
                      setBrainDump('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSaveGenerated}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft</span>
                  </button>
                </div>
              </div>
            )}

            {/* Existing Drafts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Concept Drafts</h2>
              {drafts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No drafts yet. Generate one above to get started!</p>
              ) : (
                <div className="space-y-4">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="border border-gray-200 rounded-lg p-4">
                      {editingDraft?.id === draft.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                            <textarea
                              value={editForm.summary || ''}
                              onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                              <input
                                type="text"
                                value={editForm.timeframe || ''}
                                onChange={(e) => setEditForm({ ...editForm, timeframe: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Potential Start</label>
                              <input
                                type="text"
                                value={editForm.potentialStart || ''}
                                onChange={(e) => setEditForm({ ...editForm, potentialStart: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingDraft(null)
                                setEditForm({})
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{draft.title}</h3>
                                {draft.status === 'CONFIRMED' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Confirmed</span>
                                )}
                              </div>
                              {draft.summary && (
                                <p className="text-gray-700 text-sm mb-2">{draft.summary}</p>
                              )}
                              <div className="flex space-x-4 text-xs text-gray-500">
                                {draft.timeframe && <span>Timeframe: {draft.timeframe}</span>}
                                {draft.potentialStart && <span>Start: {draft.potentialStart}</span>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {draft.status !== 'CONFIRMED' && (
                                <button
                                  onClick={() => handleConfirmDraft(draft.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Confirm"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => startEdit(draft)}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(draft.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

