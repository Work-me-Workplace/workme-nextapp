'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Ship, ArrowLeft, Wand2, FileText, Loader2 } from 'lucide-react'

type Mode = 'manual' | 'ai'

interface UnitFormData {
  hullNumber: string
  name: string
  block: string
  shipyard: string
  description: string
  status: string
  percentComplete: string
  deliveryExpected: string
}

interface AIParseResult {
  hullNumber: string
  name: string | null
  block: string | null
  shipyard: string | null
  status: string | null
  percentComplete: number | null
  milestoneType: string | null
  milestoneDate: string | null
}

export default function CreateUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: platformId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<Mode>('manual')
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [aiResult, setAiResult] = useState<AIParseResult | null>(null)
  const [formData, setFormData] = useState<UnitFormData>({
    hullNumber: '',
    name: '',
    block: '',
    shipyard: '',
    description: '',
    status: '',
    percentComplete: '',
    deliveryExpected: '',
  })

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

  async function handleAIParse(text: string) {
    if (!text.trim()) {
      alert('Please paste some text to parse')
      return
    }

    try {
      setParsing(true)
      // Use the platform process-news endpoint or create a unit-specific parser
      const response = await api.post('/api/platform/process-news', {
        platformProductId: platformId,
        rawText: text,
      })

      if (response.data.success) {
        // Parse the response to extract unit info
        // This is a simplified version - you may need to enhance the AI parsing
        const result: AIParseResult = {
          hullNumber: '',
          name: null,
          block: null,
          shipyard: null,
          status: null,
          percentComplete: null,
          milestoneType: null,
          milestoneDate: null,
        }
        setAiResult(result)
      } else {
        alert('Failed to parse: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to parse with AI:', error)
      alert('Failed to parse: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  function applyAIResult() {
    if (!aiResult) return
    setFormData({
      ...formData,
      hullNumber: aiResult.hullNumber || formData.hullNumber,
      name: aiResult.name || formData.name,
      block: aiResult.block || formData.block,
      shipyard: aiResult.shipyard || formData.shipyard,
      status: aiResult.status || formData.status,
      percentComplete: aiResult.percentComplete?.toString() || formData.percentComplete,
    })
    setActiveMode('manual')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.hullNumber) {
      alert('Hull Number is required')
      return
    }

    try {
      setLoading(true)
      const payload = {
        platformProductId: platformId,
        hullNumber: formData.hullNumber,
        name: formData.name || null,
        block: formData.block || null,
        shipyard: formData.shipyard || null,
        description: formData.description || null,
        status: formData.status || null,
        percentComplete: formData.percentComplete ? parseInt(formData.percentComplete) : null,
        deliveryExpected: formData.deliveryExpected || null,
      }

      const response = await api.post('/api/company/products/platform/unit/create', payload)

      if (response.data.success) {
        router.push(`/mycompany/platforms/${platformId}`)
      } else {
        alert('Failed to create unit: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create unit:', error)
      alert('Failed to create unit: ' + (error.response?.data?.error || error.message))
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
              href={`/mycompany/platforms/${platformId}`}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Platform
            </Link>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <Ship className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Create Platform Unit</h1>
              </div>

              {/* Mode Selection */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveMode('manual')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeMode === 'manual'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setActiveMode('ai')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeMode === 'ai'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Wand2 className="h-4 w-4 inline mr-2" />
                    AI Ingest
                  </button>
                </nav>
              </div>

              {/* Manual Mode */}
              {activeMode === 'manual' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="hullNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Hull Number *
                    </label>
                    <input
                      type="text"
                      id="hullNumber"
                      required
                      value={formData.hullNumber}
                      onChange={(e) => setFormData({ ...formData, hullNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., SSN 804"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Barb"
                      />
                    </div>

                    <div>
                      <label htmlFor="block" className="block text-sm font-medium text-gray-700 mb-2">
                        Block
                      </label>
                      <input
                        type="text"
                        id="block"
                        value={formData.block}
                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Block V"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="shipyard" className="block text-sm font-medium text-gray-700 mb-2">
                      Shipyard
                    </label>
                    <input
                      type="text"
                      id="shipyard"
                      value={formData.shipyard}
                      onChange={(e) => setFormData({ ...formData, shipyard: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., HII Newport News"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Unit description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Status
                      </label>
                      <input
                        type="text"
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Under Construction"
                      />
                    </div>

                    <div>
                      <label htmlFor="percentComplete" className="block text-sm font-medium text-gray-700 mb-2">
                        Percent Complete
                      </label>
                      <input
                        type="number"
                        id="percentComplete"
                        min="0"
                        max="100"
                        value={formData.percentComplete}
                        onChange={(e) => setFormData({ ...formData, percentComplete: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="deliveryExpected" className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      id="deliveryExpected"
                      value={formData.deliveryExpected}
                      onChange={(e) => setFormData({ ...formData, deliveryExpected: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <Link
                      href={`/mycompany/platforms/${platformId}`}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Unit'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* AI Mode */}
              {activeMode === 'ai' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="aiText" className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Press Release or Article
                    </label>
                    <textarea
                      id="aiText"
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Paste press release or article text about this submarine..."
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        const textarea = document.getElementById('aiText') as HTMLTextAreaElement
                        if (textarea) {
                          handleAIParse(textarea.value)
                        }
                      }}
                      disabled={parsing}
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
                          Parse with AI
                        </>
                      )}
                    </button>
                  </div>

                  {aiResult && (
                    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Parsed Results</h3>
                      <div className="space-y-3 text-sm">
                        {aiResult.hullNumber && (
                          <div>
                            <span className="font-medium">Hull Number:</span> {aiResult.hullNumber}
                          </div>
                        )}
                        {aiResult.name && (
                          <div>
                            <span className="font-medium">Name:</span> {aiResult.name}
                          </div>
                        )}
                        {aiResult.block && (
                          <div>
                            <span className="font-medium">Block:</span> {aiResult.block}
                          </div>
                        )}
                        {aiResult.shipyard && (
                          <div>
                            <span className="font-medium">Shipyard:</span> {aiResult.shipyard}
                          </div>
                        )}
                        {aiResult.status && (
                          <div>
                            <span className="font-medium">Status:</span> {aiResult.status}
                          </div>
                        )}
                        {aiResult.percentComplete !== null && (
                          <div>
                            <span className="font-medium">Percent Complete:</span> {aiResult.percentComplete}%
                          </div>
                        )}
                        {aiResult.milestoneType && (
                          <div>
                            <span className="font-medium">Milestone:</span> {aiResult.milestoneType}
                            {aiResult.milestoneDate && ` on ${aiResult.milestoneDate}`}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={applyAIResult}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                      >
                        Apply to Form
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
