'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, FileText, Sparkles, Copy } from 'lucide-react'
import api from '@/lib/api'

function NewCommsPlanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [rawText, setRawText] = useState('')
  const [parsedFields, setParsedFields] = useState<{
    title: string | null
    objectives: string[]
    messages: string[]
    tactics: string[]
    timeline: any
  } | null>(null)
  const [productId, setProductId] = useState<string | null>(null)

  // Check if we're creating from a source
  const sourceId = searchParams?.get('sourceId')
  const sourceType = searchParams?.get('sourceType')

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

  const handleParse = async () => {
    if (!rawText.trim()) {
      alert('Please enter some text to parse')
      return
    }

    try {
      setParsing(true)
      
      // Create product first with raw text
      const createResponse = await api.post('/api/mywork/comms-plan/create', {
        rawText: rawText.trim(),
      })

      if (!createResponse.data.success) {
        throw new Error(createResponse.data.error || 'Failed to create comms plan')
      }

      const product = createResponse.data.product
      setProductId(product.id)

      // Parse the raw text
      const parseResponse = await api.post(`/api/mywork/comms-plan/${product.id}/parse`, {
        rawText: rawText.trim(),
      })

      if (parseResponse.data.success) {
        setParsedFields({
          title: parseResponse.data.parsed.title,
          objectives: parseResponse.data.parsed.objectives,
          messages: parseResponse.data.parsed.messages,
          tactics: parseResponse.data.parsed.tactics,
          timeline: parseResponse.data.parsed.timeline,
        })
      } else {
        throw new Error(parseResponse.data.error || 'Failed to parse')
      }
    } catch (error: any) {
      console.error('Failed to parse:', error)
      alert(error.response?.data?.error || error.message || 'Failed to parse comms plan')
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    if (!productId) {
      alert('Please parse the text first')
      return
    }

    try {
      setLoading(true)
      
      // Update product with any manual edits
      await api.put(`/api/mywork/comms-plan/${productId}`, {
        title: parsedFields?.title,
        objectives: parsedFields?.objectives,
        messages: parsedFields?.messages,
        tactics: parsedFields?.tactics,
        timeline: parsedFields?.timeline,
      })

      // Redirect to view page
      router.push(`/mywork/products/comms-plan/${productId}`)
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert(error.response?.data?.error || error.message || 'Failed to save comms plan')
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
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
            <Link
              href="/mywork/products"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">New Comms Plan</h1>
                <p className="text-gray-600">
                  Paste raw text below and AI will parse it into structured fields: title, objectives, messages, tactics, and timeline.
                </p>
                {sourceId && sourceType && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Creating from source:</strong> {sourceType}
                    </p>
                  </div>
                )}
              </div>

              {!parsedFields ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                      Raw Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rawText"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={20}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Paste your communications plan text here..."
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Paste the complete communications plan text. AI will parse it into structured fields.
                    </p>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Link
                      href="/mywork/products"
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleParse}
                      disabled={parsing || !rawText.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {parsing ? 'Parsing...' : 'Parse with AI'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Successfully parsed! Review and edit the fields below, then save.
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={parsedFields.title || ''}
                      onChange={(e) => setParsedFields({ ...parsedFields, title: e.target.value || null })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Comms plan title"
                    />
                  </div>

                  {/* Objectives */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objectives
                    </label>
                    <div className="space-y-2">
                      {parsedFields.objectives.map((obj, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={obj}
                            onChange={(e) => {
                              const newObjectives = [...parsedFields.objectives]
                              newObjectives[i] = e.target.value
                              setParsedFields({ ...parsedFields, objectives: newObjectives })
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => {
                              const newObjectives = parsedFields.objectives.filter((_, idx) => idx !== i)
                              setParsedFields({ ...parsedFields, objectives: newObjectives })
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setParsedFields({ ...parsedFields, objectives: [...parsedFields.objectives, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Objective
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Messages
                    </label>
                    <div className="space-y-2">
                      {parsedFields.messages.map((msg, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={msg}
                            onChange={(e) => {
                              const newMessages = [...parsedFields.messages]
                              newMessages[i] = e.target.value
                              setParsedFields({ ...parsedFields, messages: newMessages })
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => {
                              const newMessages = parsedFields.messages.filter((_, idx) => idx !== i)
                              setParsedFields({ ...parsedFields, messages: newMessages })
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setParsedFields({ ...parsedFields, messages: [...parsedFields.messages, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Message
                      </button>
                    </div>
                  </div>

                  {/* Tactics */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tactics
                    </label>
                    <div className="space-y-2">
                      {parsedFields.tactics.map((tactic, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={tactic}
                            onChange={(e) => {
                              const newTactics = [...parsedFields.tactics]
                              newTactics[i] = e.target.value
                              setParsedFields({ ...parsedFields, tactics: newTactics })
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => {
                              const newTactics = parsedFields.tactics.filter((_, idx) => idx !== i)
                              setParsedFields({ ...parsedFields, tactics: newTactics })
                            }}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setParsedFields({ ...parsedFields, tactics: [...parsedFields.tactics, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Add Tactic
                      </button>
                    </div>
                  </div>

                  {/* Timeline Preview */}
                  {parsedFields.timeline && parsedFields.timeline.phases && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeline / Product Matrix
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(parsedFields.timeline, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setParsedFields(null)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Back to Edit
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Comms Plan'}
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

export default function NewCommsPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <NewCommsPlanPageContent />
    </Suspense>
  )
}
