'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, FileText, Sparkles, Copy, Download } from 'lucide-react'
import api from '@/lib/api'

interface CommsPlanProduct {
  id: string
  rawText: string | null
  parsedTitle: string | null
  parsedObjectives: string[] | null
  parsedMessages: string[] | null
  parsedTactics: string[] | null
  parsedTimeline: any
  fullText: string | null
  createdAt: string
  updatedAt: string
}

export default function CommsPlanViewPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [product, setProduct] = useState<CommsPlanProduct | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedFields, setEditedFields] = useState<{
    title: string | null
    objectives: string[]
    messages: string[]
    tactics: string[]
  } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workMeIdValue = getWorkMeIdFromStorage()
      if (!workMeIdValue) {
        router.push('/signin')
        return
      }
      setWorkMeId(workMeIdValue)
      loadProduct()
    }
  }, [router, id])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/mywork/comms-plan/${id}`)
      
      if (response.data.success) {
        const prod = response.data.product
        setProduct(prod)
        setEditedFields({
          title: prod.parsedTitle,
          objectives: Array.isArray(prod.parsedObjectives) ? prod.parsedObjectives : [],
          messages: Array.isArray(prod.parsedMessages) ? prod.parsedMessages : [],
          tactics: Array.isArray(prod.parsedTactics) ? prod.parsedTactics : [],
        })
      } else {
        alert('Failed to load comms plan')
        router.push('/mywork/products')
      }
    } catch (error: any) {
      console.error('Failed to load:', error)
      alert(error.response?.data?.error || 'Failed to load comms plan')
      router.push('/mywork/products')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFullText = async () => {
    if (!product) return

    try {
      setGenerating(true)
      const response = await api.post(`/api/mywork/comms-plan/${id}/generate`)
      
      if (response.data.success) {
        setProduct({ ...product, fullText: response.data.fullText })
      } else {
        alert(response.data.error || 'Failed to generate full comms plan')
      }
    } catch (error: any) {
      console.error('Failed to generate:', error)
      alert(error.response?.data?.error || 'Failed to generate full comms plan')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!product || !editedFields) return

    try {
      setLoading(true)
      await api.put(`/api/mywork/comms-plan/${id}`, {
        title: editedFields.title,
        objectives: editedFields.objectives,
        messages: editedFields.messages,
        tactics: editedFields.tactics,
      })

      setProduct({
        ...product,
        parsedTitle: editedFields.title,
        parsedObjectives: editedFields.objectives,
        parsedMessages: editedFields.messages,
        parsedTactics: editedFields.tactics,
      })
      setEditing(false)
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert(error.response?.data?.error || 'Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyFullText = () => {
    if (!product?.fullText) return
    navigator.clipboard.writeText(product.fullText)
    alert('Copied to clipboard!')
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const displayFields = editing && editedFields ? editedFields : {
    title: product.parsedTitle,
    objectives: Array.isArray(product.parsedObjectives) ? product.parsedObjectives : [],
    messages: Array.isArray(product.parsedMessages) ? product.parsedMessages : [],
    tactics: Array.isArray(product.parsedTactics) ? product.parsedTactics : [],
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
            <Link
              href="/mywork/products"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>

            <div className="bg-white rounded-lg shadow p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {displayFields.title || 'Comms Plan'}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Created {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditing(false)
                          setEditedFields({
                            title: product.parsedTitle,
                            objectives: Array.isArray(product.parsedObjectives) ? product.parsedObjectives : [],
                            messages: Array.isArray(product.parsedMessages) ? product.parsedMessages : [],
                            tactics: Array.isArray(product.parsedTactics) ? product.parsedTactics : [],
                          })
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editedFields?.title || ''}
                    onChange={(e) => setEditedFields({ ...editedFields!, title: e.target.value || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{displayFields.title || 'No title'}</p>
                )}
              </div>

              {/* Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectives
                </label>
                {editing ? (
                  <div className="space-y-2">
                    {editedFields?.objectives.map((obj, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={obj}
                          onChange={(e) => {
                            const newObjectives = [...editedFields!.objectives]
                            newObjectives[i] = e.target.value
                            setEditedFields({ ...editedFields!, objectives: newObjectives })
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            const newObjectives = editedFields!.objectives.filter((_, idx) => idx !== i)
                            setEditedFields({ ...editedFields!, objectives: newObjectives })
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditedFields({ ...editedFields!, objectives: [...editedFields!.objectives, ''] })}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Objective
                    </button>
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {displayFields.objectives.length > 0 ? (
                      displayFields.objectives.map((obj, i) => (
                        <li key={i} className="text-gray-700">{obj}</li>
                      ))
                    ) : (
                      <li className="text-gray-400">No objectives</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Messages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Messages
                </label>
                {editing ? (
                  <div className="space-y-2">
                    {editedFields?.messages.map((msg, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={msg}
                          onChange={(e) => {
                            const newMessages = [...editedFields!.messages]
                            newMessages[i] = e.target.value
                            setEditedFields({ ...editedFields!, messages: newMessages })
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            const newMessages = editedFields!.messages.filter((_, idx) => idx !== i)
                            setEditedFields({ ...editedFields!, messages: newMessages })
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditedFields({ ...editedFields!, messages: [...editedFields!.messages, ''] })}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Message
                    </button>
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {displayFields.messages.length > 0 ? (
                      displayFields.messages.map((msg, i) => (
                        <li key={i} className="text-gray-700">{msg}</li>
                      ))
                    ) : (
                      <li className="text-gray-400">No messages</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Tactics */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tactics
                </label>
                {editing ? (
                  <div className="space-y-2">
                    {editedFields?.tactics.map((tactic, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={tactic}
                          onChange={(e) => {
                            const newTactics = [...editedFields!.tactics]
                            newTactics[i] = e.target.value
                            setEditedFields({ ...editedFields!, tactics: newTactics })
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            const newTactics = editedFields!.tactics.filter((_, idx) => idx !== i)
                            setEditedFields({ ...editedFields!, tactics: newTactics })
                          }}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setEditedFields({ ...editedFields!, tactics: [...editedFields!.tactics, ''] })}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Tactic
                    </button>
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {displayFields.tactics.length > 0 ? (
                      displayFields.tactics.map((tactic, i) => (
                        <li key={i} className="text-gray-700">{tactic}</li>
                      ))
                    ) : (
                      <li className="text-gray-400">No tactics</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Timeline */}
              {product.parsedTimeline && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline / Product Matrix
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(product.parsedTimeline, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Full Text Generation */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Full Comms Plan Document</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Generate a complete, formatted comms plan document ready for Word export
                    </p>
                  </div>
                  {!product.fullText && (
                    <button
                      onClick={handleGenerateFullText}
                      disabled={generating}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {generating ? 'Generating...' : 'Generate Full Plan'}
                    </button>
                  )}
                </div>

                {product.fullText ? (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                        {product.fullText}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyFullText}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy to Clipboard
                      </button>
                      <button
                        onClick={handleGenerateFullText}
                        disabled={generating}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {generating ? 'Regenerating...' : 'Regenerate'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Click "Generate Full Plan" to create a complete comms plan document.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
