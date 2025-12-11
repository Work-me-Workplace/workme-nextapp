'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Ship, ArrowLeft, Wand2, Loader2 } from 'lucide-react'

interface PlatformData {
  name: string
  category: string
  platformSeries?: string | null
  description?: string | null
  whySpecial?: string | null
  payloadNotes?: string | null
  intendedTotalUnits?: number | null
  knownShipsInClass?: string[]
  currentProgressEstimate?: number | null
  programStatus?: string | null
  nextDeliveryExpected?: string | null
  lastDeliveryDate?: string | null
  totalLength?: string | null
  totalBeam?: string | null
  totalDisplacementSubmerged?: string | null
  totalManpowerNeeds?: string | null
  totalTimeToBuild?: string | null
  totalEstimatedCostPerUnit?: string | null
  sensors?: string[]
  defenseBuilders?: string[]
  unitsInSeries?: string[]
  yearsSinceLastInClass?: number | null
  classStartDate?: string | null
}

interface UnitData {
  hullNumber: string
  name?: string | null
  lifecycleStatus?: string | null
}

interface MilestoneData {
  milestoneType: 'CONTRACT_AWARDED' | 'KEEL_LAYING' | 'HULL_COMPLETION' | 'LAUNCH' | 'SEA_TRIALS' | 'DELIVERY' | 'COMMISSIONING'
  description?: string | null
  date?: string | null
  unitHullNumber?: string | null
}

interface AIParseResult {
  platform: PlatformData
  units: UnitData[]
  milestones: MilestoneData[]
}

export default function CreatePlatformPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [reviewData, setReviewData] = useState<AIParseResult | null>(null)
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

          {!reviewData ? (
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
                <p className="text-sm text-gray-500 mt-2">
                  AI will extract platform details, units, and milestones from your text.
                </p>
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
          ) : (
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Series</label>
                    <input
                      type="text"
                      value={reviewData.platform.platformSeries || ''}
                      onChange={(e) => setReviewData({
                        ...reviewData,
                        platform: { ...reviewData.platform, platformSeries: e.target.value }
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class Start Date (Lead Ship Keel Laid Down)</label>
                    <input
                      type="date"
                      value={reviewData.platform.classStartDate || ''}
                      onChange={(e) => setReviewData({
                        ...reviewData,
                        platform: { ...reviewData.platform, classStartDate: e.target.value || null }
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Type</label>
                            <select
                              value={milestone.milestoneType}
                              onChange={(e) => {
                                const newMilestones = [...reviewData.milestones]
                                newMilestones[idx].milestoneType = e.target.value as any
                                setReviewData({ ...reviewData, milestones: newMilestones })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="CONTRACT_AWARDED">Contract Awarded</option>
                              <option value="KEEL_LAYING">Keel Laying</option>
                              <option value="HULL_COMPLETION">Hull Completion</option>
                              <option value="LAUNCH">Launch</option>
                              <option value="SEA_TRIALS">Sea Trials</option>
                              <option value="DELIVERY">Delivery</option>
                              <option value="COMMISSIONING">Commissioning</option>
                            </select>
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
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit Hull Number (optional)</label>
                          <input
                            type="text"
                            value={milestone.unitHullNumber || ''}
                            onChange={(e) => {
                              const newMilestones = [...reviewData.milestones]
                              newMilestones[idx].unitHullNumber = e.target.value || null
                              setReviewData({ ...reviewData, milestones: newMilestones })
                            }}
                            placeholder="e.g., SSN 804"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            rows={2}
                            value={milestone.description || ''}
                            onChange={(e) => {
                              const newMilestones = [...reviewData.milestones]
                              newMilestones[idx].description = e.target.value || null
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
                    setAiText('')
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Start Over
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
