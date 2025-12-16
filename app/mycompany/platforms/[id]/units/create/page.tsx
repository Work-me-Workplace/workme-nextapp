'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Ship, ArrowLeft, Wand2, Loader2 } from 'lucide-react'

interface UnitData {
  hullNumber: string
  name?: string | null
  platformClass?: string | null
  numberInClass?: number | null
  defenseContractor?: string | null
  shipyard?: string | null
  whereBuilt?: string | null
  unitCost?: string | null
  constructionStartDate?: string | null
  constructionCompleteDate?: string | null
  deliveryToFleetDate?: string | null
  commissioningDate?: string | null
  homeport?: string | null
  currentStatus?: string | null
  percentComplete?: number | null
  createdVia: 'AI_INGEST'
}

export default function CreateUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: platformId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [reviewData, setReviewData] = useState<UnitData | null>(null)
  const [aiText, setAiText] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setAuthReady(true)
        let id = getWorkMeIdFromStorage()
        
        // If workMeId not in localStorage, try to refresh from API
        if (!id) {
          try {
            const refreshed = await refreshWorkMe()
            if (refreshed) {
              id = refreshed.id
            }
          } catch (error) {
            console.error('Failed to refresh WorkMe:', error)
          }
        }
        
        if (id) {
          setWorkMeId(id)
        } else {
          // Still no workMeId after refresh attempt - redirect to signin
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router])

  async function handleAIParse() {
    if (!aiText.trim()) {
      alert('Please paste some text to parse')
      return
    }

    try {
      setParsing(true)
      const response = await api.post('/api/platform/unit/ai-parse', { text: aiText })

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

  const [createdUnitId, setCreatedUnitId] = useState<string | null>(null)

  async function handleReviewSubmit() {
    if (!reviewData) return

    try {
      setLoading(true)
      const payload = {
        platformProductId: platformId,
        unit: reviewData,
      }

      const response = await api.post('/api/company/products/platform/unit/create-with-ai', payload)

      if (response.data.success) {
        setCreatedUnitId(response.data.unit.id)
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

  if (!authReady || !workMeId) {
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

              {!reviewData ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="aiText" className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Article or Text
                    </label>
                    <textarea
                      id="aiText"
                      rows={12}
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Paste any article, fact file, or Wikipedia entry about this platform unit..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      AI will extract unit details and milestones from your text.
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <Link
                      href={`/mycompany/platforms/${platformId}`}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleAIParse}
                      disabled={parsing || !aiText.trim()}
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
                          Ingest with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Review the parsed data below. You can edit fields before creating the unit.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hull Number *</label>
                        <input
                          type="text"
                          value={reviewData.hullNumber}
                          onChange={(e) =>
                            setReviewData({
                              ...reviewData,
                              hullNumber: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={reviewData.name || ''}
                          onChange={(e) =>
                            setReviewData({
                              ...reviewData,
                              name: e.target.value || null,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number in Class</label>
                          <input
                            type="number"
                            value={reviewData.numberInClass || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                numberInClass: e.target.value ? parseInt(e.target.value) : null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Platform Class</label>
                          <input
                            type="text"
                            value={reviewData.platformClass || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                platformClass: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Shipyard</label>
                          <input
                            type="text"
                            value={reviewData.shipyard || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                shipyard: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Defense Contractor</label>
                          <input
                            type="text"
                            value={reviewData.defenseContractor || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                defenseContractor: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Where Built</label>
                        <input
                          type="text"
                          value={reviewData.whereBuilt || ''}
                          onChange={(e) =>
                            setReviewData({
                              ...reviewData,
                              whereBuilt: e.target.value || null,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost</label>
                        <input
                          type="text"
                          value={reviewData.unitCost || ''}
                          onChange={(e) =>
                            setReviewData({
                              ...reviewData,
                              unitCost: e.target.value || null,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                          <input
                            type="text"
                            value={reviewData.currentStatus || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                currentStatus: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Percent Complete</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={reviewData.percentComplete || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                percentComplete: e.target.value ? parseInt(e.target.value) : null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Construction Start Date</label>
                          <input
                            type="date"
                            value={reviewData.constructionStartDate || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                constructionStartDate: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Construction Complete Date</label>
                          <input
                            type="date"
                            value={reviewData.constructionCompleteDate || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                constructionCompleteDate: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery to Fleet Date</label>
                          <input
                            type="date"
                            value={reviewData.deliveryToFleetDate || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                deliveryToFleetDate: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Commissioning Date</label>
                          <input
                            type="date"
                            value={reviewData.commissioningDate || ''}
                            onChange={(e) =>
                              setReviewData({
                                ...reviewData,
                                commissioningDate: e.target.value || null,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Homeport</label>
                        <input
                          type="text"
                          value={reviewData.homeport || ''}
                          onChange={(e) =>
                            setReviewData({
                              ...reviewData,
                              homeport: e.target.value || null,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

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
                      {loading ? 'Creating...' : 'Create Unit'}
                    </button>
                  </div>
                </div>
              )}

              {/* Success Screen with Options */}
              {createdUnitId && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-xl font-semibold text-green-900">Unit Created Successfully!</h2>
                    </div>
                    <p className="text-sm text-green-800 mb-4">
                      What would you like to do next?
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <Link
                        href={`/mycompany/platforms/${platformId}/units/${createdUnitId}/namesake`}
                        className="flex items-center justify-center px-4 py-3 border-2 border-green-300 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <span className="font-medium">1. Add Namesake</span>
                      </Link>

                      <Link
                        href={`/mycompany/platforms/${platformId}/units/${createdUnitId}/living-homage`}
                        className="flex items-center justify-center px-4 py-3 border-2 border-green-300 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <span className="font-medium">2. Add Living Homage</span>
                      </Link>

                      <Link
                        href={`/mycompany/platforms/${platformId}/units/${createdUnitId}/update`}
                        className="flex items-center justify-center px-4 py-3 border-2 border-green-300 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <span className="font-medium">3. Add Update</span>
                      </Link>

                      <Link
                        href={`/mycompany/platforms/${platformId}/units/${createdUnitId}/statement`}
                        className="flex items-center justify-center px-4 py-3 border-2 border-green-300 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <span className="font-medium">4. Add Statement</span>
                      </Link>
                    </div>

                    <div className="mt-6 flex items-center justify-end space-x-4">
                      <Link
                        href={`/mycompany/platforms/${platformId}`}
                        className="px-4 py-2 text-sm text-green-700 hover:text-green-900"
                      >
                        Skip for now
                      </Link>
                      <Link
                        href={`/mycompany/platforms/${platformId}/units/${createdUnitId}`}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        View Unit
                      </Link>
                    </div>
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
