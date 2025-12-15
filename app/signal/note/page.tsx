'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { FileText, Search, ExternalLink, CheckCircle, XCircle, Plus, Save, Loader2 } from 'lucide-react'
import type {
  NoteLookupResponse,
  SignalSearchResult,
  ProductFamilyOption,
  ProductPlatformOption,
  EvidenceAttachmentRequest,
  EvidenceAttachmentResponse,
} from '@/lib/types/signal'

type AttachmentStep = 'selection' | 'attachment' | 'saving' | 'complete'

export default function NoteLookupPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signal, setSignal] = useState('')
  const [results, setResults] = useState<NoteLookupResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Evidence attachment state
  const [selectedEvidence, setSelectedEvidence] = useState<Set<number>>(new Set())
  const [attachmentStep, setAttachmentStep] = useState<AttachmentStep | null>(null)
  const [productFamilies, setProductFamilies] = useState<ProductFamilyOption[]>([])
  const [productPlatforms, setProductPlatforms] = useState<ProductPlatformOption[]>([])
  const [selectedProductFamilyId, setSelectedProductFamilyId] = useState<string>('')
  const [newProductFamilyName, setNewProductFamilyName] = useState('')
  const [newProductFamilyDescription, setNewProductFamilyDescription] = useState('')
  const [selectedProductPlatformId, setSelectedProductPlatformId] = useState<string>('')
  const [creatingNewFamily, setCreatingNewFamily] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signal.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)
    setSelectedEvidence(new Set())
    setAttachmentStep(null)

    try {
      const response = await api.post<NoteLookupResponse>('/api/signalingest/note/lookup', {
        signal: signal.trim(),
      })

      if (response.data.success) {
        setResults(response.data)
      } else {
        setError('Failed to lookup signal')
      }
    } catch (err: any) {
      console.error('Note lookup error:', err)
      setError(err.response?.data?.error || 'Failed to lookup signal')
    } finally {
      setLoading(false)
    }
  }

  const handleEvidenceToggle = (index: number) => {
    const newSelected = new Set(selectedEvidence)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedEvidence(newSelected)
  }

  const handleAttachEvidence = async () => {
    if (selectedEvidence.size === 0) {
      setError('Please select at least one evidence item')
      return
    }

    if (!creatingNewFamily && !selectedProductFamilyId) {
      setError('Please select or create a Product Family')
      return
    }

    if (creatingNewFamily && !newProductFamilyName.trim()) {
      setError('Product Family name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Prepare evidence data from selected items
      const evidenceData = Array.from(selectedEvidence)
        .map((index) => {
          const result = results!.results[index]
          return {
            title: result.title,
            url: result.url,
            snippet: result.snippet,
            source: result.source,
            date: result.date,
          }
        })

      const request: EvidenceAttachmentRequest = {
        evidence: evidenceData,
        productFamilyId: creatingNewFamily ? undefined : selectedProductFamilyId,
        productFamilyName: creatingNewFamily ? newProductFamilyName.trim() : undefined,
        productFamilyDescription: creatingNewFamily ? newProductFamilyDescription.trim() || undefined : undefined,
        productPlatformId: selectedProductPlatformId || undefined,
      }

      const response = await api.post<EvidenceAttachmentResponse>('/api/company/product-family/evidence', request)

      if (response.data.success) {
        setAttachmentStep('complete')
        // Reset form
        setSelectedEvidence(new Set())
        setSelectedProductFamilyId('')
        setNewProductFamilyName('')
        setNewProductFamilyDescription('')
        setSelectedProductPlatformId('')
        setCreatingNewFamily(false)
      } else {
        setError('Failed to save evidence')
      }
    } catch (err: any) {
      console.error('Evidence attachment error:', err)
      setError(err.response?.data?.error || 'Failed to save evidence')
    } finally {
      setSaving(false)
    }
  }

  const loadProductFamilies = async () => {
    try {
      const response = await api.get<{ success: boolean; productFamilies: ProductFamilyOption[] }>(
        '/api/company/product-family/list'
      )
      if (response.data.success) {
        setProductFamilies(response.data.productFamilies)
      }
    } catch (err) {
      console.error('Failed to load product families:', err)
    }
  }

  const loadProductPlatforms = async () => {
    try {
      const response = await api.get<{ success: boolean; products: any[] }>(
        '/api/company/products/platform/list'
      )
      if (response.data.success) {
        setProductPlatforms(
          response.data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
          }))
        )
      }
    } catch (err) {
      console.error('Failed to load product platforms:', err)
    }
  }

  useEffect(() => {
    if (attachmentStep === 'attachment') {
      loadProductFamilies()
      loadProductPlatforms()
    }
  }, [attachmentStep])

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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link href="/signal" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
                ← Back to Signals
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Note Lookup</h1>
              </div>
              <p className="text-gray-600">Enter a phrase you heard in a meeting to check if it's publicly verifiable</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="mb-4">
                <label htmlFor="signal" className="block text-sm font-medium text-gray-700 mb-2">
                  Signal Phrase
                </label>
                <textarea
                  id="signal"
                  value={signal}
                  onChange={(e) => setSignal(e.target.value)}
                  placeholder="e.g., 'JFK C-Trials', 'PM visit to key link', 'AUKUS review impact status'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !signal.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Lookup Signal
                  </>
                )}
              </button>
            </form>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {/* Results */}
            {results && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Results</h2>
                    <div className="flex items-center gap-2">
                      {results.public ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-green-600 font-medium">Publicly Verifiable</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-500 font-medium">Not Found Publicly</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {results.results.length > 0 ? (
                  <>
                    <div className="p-6 space-y-4">
                      {results.results.map((result: SignalSearchResult, index: number) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 transition ${
                            selectedEvidence.has(index)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {attachmentStep !== null && (
                              <input
                                type="checkbox"
                                checked={selectedEvidence.has(index)}
                                onChange={() => handleEvidenceToggle(index)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 flex-1">{result.title}</h3>
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 ml-4"
                                >
                                  <ExternalLink className="h-5 w-5" />
                                </a>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.snippet}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate max-w-md"
                                >
                                  {result.url}
                                </a>
                                {result.source && <span>Source: {result.source}</span>}
                                {result.date && <span>{result.date}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Attach Evidence Button */}
                    {results.public && attachmentStep === null && (
                      <div className="p-6 border-t border-gray-200">
                        <button
                          onClick={() => setAttachmentStep('selection')}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                          <Plus className="h-5 w-5" />
                          Attach Evidence To Product Family
                        </button>
                      </div>
                    )}

                    {/* Attachment Form */}
                    {attachmentStep === 'selection' && (
                      <div className="p-6 border-t border-gray-200 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Attach Evidence ({selectedEvidence.size} selected)
                        </h3>

                        <div className="space-y-4">
                          {/* Product Family Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Product Family *
                            </label>
                            <div className="flex gap-2 mb-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCreatingNewFamily(false)
                                  setSelectedProductFamilyId('')
                                }}
                                className={`px-3 py-2 text-sm rounded-lg ${
                                  !creatingNewFamily
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                Select Existing
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreatingNewFamily(true)
                                  setSelectedProductFamilyId('')
                                }}
                                className={`px-3 py-2 text-sm rounded-lg ${
                                  creatingNewFamily
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                Create New
                              </button>
                            </div>

                            {!creatingNewFamily ? (
                              <select
                                value={selectedProductFamilyId}
                                onChange={(e) => setSelectedProductFamilyId(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select a Product Family...</option>
                                {productFamilies.map((family) => (
                                  <option key={family.id} value={family.id}>
                                    {family.name} {family.description && `- ${family.description}`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={newProductFamilyName}
                                  onChange={(e) => setNewProductFamilyName(e.target.value)}
                                  placeholder="Product Family Name *"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  required
                                />
                                <textarea
                                  value={newProductFamilyDescription}
                                  onChange={(e) => setNewProductFamilyDescription(e.target.value)}
                                  placeholder="Description (optional)"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>

                          {/* Product Platform Selection (Optional) */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Product Platform (Optional)
                            </label>
                            <select
                              value={selectedProductPlatformId}
                              onChange={(e) => setSelectedProductPlatformId(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">None</option>
                              {productPlatforms.map((platform) => (
                                <option key={platform.id} value={platform.id}>
                                  {platform.name} {platform.category && `(${platform.category})`}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={handleAttachEvidence}
                              disabled={saving || selectedEvidence.size === 0}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-5 w-5" />
                                  Save Evidence
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setAttachmentStep(null)
                                setSelectedEvidence(new Set())
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {attachmentStep === 'complete' && (
                      <div className="p-6 border-t border-gray-200 bg-green-50">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Evidence saved successfully!</span>
                        </div>
                        <button
                          onClick={() => {
                            setAttachmentStep(null)
                            setSelectedEvidence(new Set())
                          }}
                          className="mt-3 text-sm text-green-700 hover:text-green-900 underline"
                        >
                          Attach more evidence
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500">No public results found for this signal</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

