'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Ship, ArrowLeft, Wand2, FileText, Loader2 } from 'lucide-react'

type Mode = 'manual' | 'ai'

interface PlatformData {
  name: string
  category: string
  programCode: string
  description: string
  whySpecial: string
}

interface UnitData {
  hullNumber: string
  name: string
  lifecycleStatus: string
}

interface MilestoneData {
  title: string
  description: string
  date: string
}

interface AIParseResult {
  platform: PlatformData
  units: UnitData[]
  milestones: MilestoneData[]
}

export default function CreatePlatformPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('manual')
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [reviewData, setReviewData] = useState<AIParseResult | null>(null)

  // Manual form state
  const [formData, setFormData] = useState<PlatformData>({
    name: '',
    category: '',
    programCode: '',
    description: '',
    whySpecial: '',
  })

  // AI mode state
  const [aiText, setAiText] = useState('')

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

  async function handleAIParse() {
    if (!aiText.trim()) {
      alert('Please paste some text to parse')
      return
    }

    try {
      setParsing(true)
      const response = await api.post('/api/platform/ai-parse', { text: aiText })

      if (response.data.success && response.data.data) {
        setReviewData(response.data.data)
        setMode('review')
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

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.category) {
      alert('Name and category are required')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/api/company/products/platform/create', formData)

      if (response.data.success) {
        router.push(`/company/products/platform/${response.data.product.id}`)
      } else {
        alert('Failed to create platform: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create platform:', error)
      alert('Failed to create platform: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleReviewSubmit() {
    if (!reviewData) return

    try {
      setLoading(true)
      const response = await api.post('/api/company/products/platform/create-with-units', reviewData)

      if (response.data.success) {
        router.push(`/company/products/platform/${response.data.product.id}`)
      } else {
        alert('Failed to create platform: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create platform:', error)
      alert('Failed to create platform: ' + (error.response?.data?.error || error.message))
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/company/products"
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Ship className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Platform Product</h1>
          </div>

          {/* Mode Selection */}
          {!reviewData && (
            <div className="mb-6">
              <div className="flex space-x-4 border-b border-gray-200">
                <button
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                    mode === 'manual'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Manual
                </button>
                <button
                  onClick={() => setMode('ai')}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                    mode === 'ai'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Wand2 className="h-4 w-4 inline mr-2" />
                  AI-Assisted
                </button>
              </div>
            </div>
          )}

          {/* Manual Mode */}
          {mode === 'manual' && !reviewData && (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Virginia-class"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Submarine, Surface Ship"
                />
              </div>

              <div>
                <label htmlFor="programCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Program Code
                </label>
                <input
                  type="text"
                  id="programCode"
                  value={formData.programCode}
                  onChange={(e) => setFormData({ ...formData, programCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., SSN, SSBN, DDG"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Platform description..."
                />
              </div>

              <div>
                <label htmlFor="whySpecial" className="block text-sm font-medium text-gray-700 mb-2">
                  Why Special
                </label>
                <textarea
                  id="whySpecial"
                  rows={3}
                  value={formData.whySpecial}
                  onChange={(e) => setFormData({ ...formData, whySpecial: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What makes this platform special..."
                />
              </div>

              <div className="flex items-center justify-end space-x-4">
                <Link
                  href="/company/products"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Platform'}
                </button>
              </div>
            </form>
          )}

          {/* AI Mode */}
          {mode === 'ai' && !reviewData && (
            <div className="space-y-6">
              <div>
                <label htmlFor="aiText" className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Wikipedia, CRS report, or press release text
                </label>
                <textarea
                  id="aiText"
                  rows={12}
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="Paste text here..."
                />
              </div>

              <div className="flex items-center justify-end space-x-4">
                <Link
                  href="/company/products"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleAIParse}
                  disabled={parsing || !aiText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
            </div>
          )}

          {/* Review Mode (after AI parse) */}
          {reviewData && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Review the parsed data below. You can edit fields before creating the platform.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={reviewData.platform.name}
                      onChange={(e) => setReviewData({
                        ...reviewData,
                        platform: { ...reviewData.platform, name: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <input
                      type="text"
                      value={reviewData.platform.category}
                      onChange={(e) => setReviewData({
                        ...reviewData,
                        platform: { ...reviewData.platform, category: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program Code</label>
                    <input
                      type="text"
                      value={reviewData.platform.programCode || ''}
                      onChange={(e) => setReviewData({
                        ...reviewData,
                        platform: { ...reviewData.platform, programCode: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={reviewData.platform.description || ''}
                      onChange={(e) => setReviewData({
                        ...reviewData,
                        platform: { ...reviewData.platform, description: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Why Special</label>
                    <textarea
                      rows={2}
                      value={reviewData.platform.whySpecial || ''}
                      onChange={(e) => setReviewData({
                        ...reviewData,
                        platform: { ...reviewData.platform, whySpecial: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {reviewData.units.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Units ({reviewData.units.length})</h2>
                  <div className="space-y-3">
                    {reviewData.units.map((unit, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hull Number</label>
                            <input
                              type="text"
                              value={unit.hullNumber}
                              onChange={(e) => {
                                const newUnits = [...reviewData.units]
                                newUnits[idx].hullNumber = e.target.value
                                setReviewData({ ...reviewData, units: newUnits })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={unit.name || ''}
                              onChange={(e) => {
                                const newUnits = [...reviewData.units]
                                newUnits[idx].name = e.target.value
                                setReviewData({ ...reviewData, units: newUnits })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reviewData.milestones.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Milestones ({reviewData.milestones.length})</h2>
                  <div className="space-y-3">
                    {reviewData.milestones.map((milestone, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={milestone.title}
                              onChange={(e) => {
                                const newMilestones = [...reviewData.milestones]
                                newMilestones[idx].title = e.target.value
                                setReviewData({ ...reviewData, milestones: newMilestones })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={milestone.date || ''}
                              onChange={(e) => {
                                const newMilestones = [...reviewData.milestones]
                                newMilestones[idx].date = e.target.value
                                setReviewData({ ...reviewData, milestones: newMilestones })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={milestone.description || ''}
                            onChange={(e) => {
                              const newMilestones = [...reviewData.milestones]
                              newMilestones[idx].description = e.target.value
                              setReviewData({ ...reviewData, milestones: newMilestones })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => {
                    setReviewData(null)
                    setMode('ai')
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Platform'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
