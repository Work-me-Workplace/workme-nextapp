'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Wand2, Loader2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'

type ParseableModelType =
  | 'platform_unit_update'
  | 'platform_unit_statement'
  | 'platform_statement'
  | 'platform_product'
  | 'milestone'
  | 'external_pressure'
  | 'training'
  | 'event'
  | 'career'
  | 'campaign'
  | 'impact_event'
  | 'community'
  | 'benefits'
  | 'employee_cause'

interface UpdateData {
  percentComplete?: number | null
  statusUpdate?: string | null
  scheduleNote?: string | null
  industrialBaseNote?: string | null
  leadershipQuote?: string | null
  keelLaidDate?: string | null
  seaTrialsStartDate?: string | null
  deliveryDate?: string | null
  commissioningDate?: string | null
  narrativeSummary?: string | null
  tags?: string[]
}

interface NewsArtifact {
  id: string
  headline: string | null
  rawText: string
  sourceUrl: string | null
  sourceName: string | null
}

export default function ParsePage({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [reviewData, setReviewData] = useState<any>(null)
  const [artifact, setArtifact] = useState<NewsArtifact | null>(null)
  const [modelType, setModelType] = useState<ParseableModelType>('platform_unit_update')
  const [unitId, setUnitId] = useState('')
  const [platformProductId, setPlatformProductId] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            if (refreshed) {
              id = refreshed.id
            }
          } catch (error) {
            console.error('Failed to refresh WorkMe:', error)
          }
        }
        
        if (id) {
          setWorkMeId(id)
          loadArtifact()
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router, artifactId])

  async function loadArtifact() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/utils/news-artifact/${artifactId}`)

      if (response.data.success && response.data.data) {
        setArtifact(response.data.data)
      } else {
        setError(response.data.error || 'Failed to load article')
      }
    } catch (error: any) {
      console.error('Failed to load artifact:', error)
      setError(error.response?.data?.error || error.message || 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  async function handleAIParse() {
    if (!artifact?.rawText) {
      setError('No article text available')
      return
    }

    if (!modelType) {
      setError('Please select a model type')
      return
    }

    try {
      setParsing(true)
      setError(null)
      const response = await api.post('/api/utils/news-artifact/parse', {
        artifactId: artifact.id,
        modelType,
        text: artifact.rawText,
      })

      if (response.data.success && response.data.data) {
        setReviewData(response.data.data)
      } else {
        setError(response.data.error || 'Failed to parse article')
      }
    } catch (error: any) {
      console.error('Failed to parse with AI:', error)
      setError(error.response?.data?.error || error.message || 'Failed to parse article')
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit() {
    if (!reviewData) {
      setError('No data to save')
      return
    }

    // Validate required fields based on model type
    if (modelType === 'platform_unit_update' && !unitId.trim()) {
      setError('Please enter a platform unit ID')
      return
    }

    if (modelType === 'platform_unit_statement' && !unitId.trim()) {
      setError('Please enter a platform unit ID')
      return
    }

    if (modelType === 'platform_statement' && !platformProductId.trim()) {
      setError('Please enter a platform product ID')
      return
    }

    try {
      setLoading(true)
      setError(null)

      let response
      if (modelType === 'platform_unit_update') {
        response = await api.post(`/api/company/products/platform/unit/${unitId}/update`, {
          ...reviewData,
          newsArtifactId: artifact?.id,
        })
      } else if (modelType === 'platform_unit_statement') {
        // TODO: Create API endpoint for platform unit statement
        setError('Platform unit statement save not yet implemented')
        return
      } else if (modelType === 'platform_statement') {
        // TODO: Create API endpoint for platform statement
        setError('Platform statement save not yet implemented')
        return
      } else {
        // For CompanyX types, use the existing workstuff/add endpoint
        response = await api.post('/api/workforcestuff/add', {
          type: modelType,
          data: reviewData,
          newsArtifactId: artifact?.id,
        })
      }

      if (response.data.success) {
        setSuccess(true)
      } else {
        setError(response.data.error || 'Failed to save')
      }
    } catch (error: any) {
      console.error('Failed to save:', error)
      setError(error.response?.data?.error || error.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  // Don't auto-parse - let user select model type first

  // Load artifact when ready
  useEffect(() => {
    if (authReady && artifactId && workMeId) {
      loadArtifact()
    }
  }, [authReady, artifactId, workMeId])

  if (!authReady || !workMeId) {
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/signal/clip"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clip Ingest
            </Link>

            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center mb-6">
                <Wand2 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Parse for Update Model</h1>
                  <p className="text-gray-600 mt-1">Step 2: Review parsed data and save</p>
                </div>
              </div>

              {success ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                      <h2 className="text-xl font-semibold text-green-900">Update Saved Successfully!</h2>
                    </div>
                    <p className="text-sm text-green-800 mb-4">
                      The update has been saved to the platform unit.
                    </p>
                    <div className="flex items-center justify-end space-x-4">
                      <Link
                        href="/signal/clip"
                        className="px-6 py-2 border border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50"
                      >
                        Ingest Another
                      </Link>
                    </div>
                  </div>
                </div>
              ) : !reviewData ? (
                <div className="space-y-6">
                  {/* Model Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Model Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modelType}
                      onChange={(e) => {
                        setModelType(e.target.value as ParseableModelType)
                        setReviewData(null) // Reset parsed data when model changes
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={parsing}
                    >
                      <optgroup label="Platform Models">
                        <option value="platform_unit_update">Platform Unit Update</option>
                        <option value="platform_unit_statement">Platform Unit Statement</option>
                        <option value="platform_statement">Platform Statement</option>
                        <option value="platform_product">Platform Product</option>
                      </optgroup>
                      <optgroup label="Company Models">
                        <option value="milestone">Milestone</option>
                        <option value="external_pressure">External Pressure</option>
                      </optgroup>
                      <optgroup label="CompanyX Models">
                        <option value="training">Training</option>
                        <option value="event">Event</option>
                        <option value="career">Career</option>
                        <option value="campaign">Campaign</option>
                        <option value="impact_event">Impact Event</option>
                        <option value="community">Community</option>
                        <option value="benefits">Benefits</option>
                        <option value="employee_cause">Employee Cause</option>
                      </optgroup>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose the model type to parse this article into
                    </p>
                  </div>

                  {artifact && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Article Preview</p>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {artifact.headline || artifact.rawText.substring(0, 200)}...
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleAIParse}
                      disabled={parsing || !modelType}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {parsing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Parse Article
                        </>
                      )}
                    </button>
                  </div>

                  {parsing && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  )}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Review the parsed data below. You can edit fields before saving.
                    </p>
                  </div>

                  {/* Model Type Display */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">
                      Parsing as: <span className="text-blue-600 capitalize">{modelType.replace(/_/g, ' ')}</span>
                    </p>
                  </div>

                  {/* Unit/Product ID Input - Conditional based on model type */}
                  {(modelType === 'platform_unit_update' || modelType === 'platform_unit_statement') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform Unit ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        placeholder="Enter the platform unit ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You can find the unit ID from the platform unit detail page URL
                      </p>
                    </div>
                  )}

                  {modelType === 'platform_statement' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform Product ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={platformProductId}
                        onChange={(e) => setPlatformProductId(e.target.value)}
                        placeholder="Enter the platform product ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You can find the product ID from the platform product detail page URL
                      </p>
                    </div>
                  )}

                  {/* Parsed Data Fields - Show different fields based on model type */}
                  {modelType === 'platform_unit_update' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Percent Complete</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={reviewData.percentComplete || ''}
                            onChange={(e) => setReviewData({ 
                              ...reviewData, 
                              percentComplete: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status Update</label>
                          <input
                            type="text"
                            value={reviewData.statusUpdate || ''}
                            onChange={(e) => setReviewData({ ...reviewData, statusUpdate: e.target.value || null })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="e.g., Keel Laid, Construction 60% complete"
                          />
                        </div>
                      </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Note</label>
                      <input
                        type="text"
                        value={reviewData.scheduleNote || ''}
                        onChange={(e) => setReviewData({ ...reviewData, scheduleNote: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industrial Base Note</label>
                      <input
                        type="text"
                        value={reviewData.industrialBaseNote || ''}
                        onChange={(e) => setReviewData({ ...reviewData, industrialBaseNote: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Leadership Quote</label>
                      <textarea
                        rows={2}
                        value={reviewData.leadershipQuote || ''}
                        onChange={(e) => setReviewData({ ...reviewData, leadershipQuote: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Keel Laid Date</label>
                        <input
                          type="date"
                          value={reviewData.keelLaidDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, keelLaidDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sea Trials Start Date</label>
                        <input
                          type="date"
                          value={reviewData.seaTrialsStartDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, seaTrialsStartDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                        <input
                          type="date"
                          value={reviewData.deliveryDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, deliveryDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Commissioning Date</label>
                        <input
                          type="date"
                          value={reviewData.commissioningDate || ''}
                          onChange={(e) => setReviewData({ ...reviewData, commissioningDate: e.target.value || null })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Narrative Summary</label>
                      <textarea
                        rows={3}
                        value={reviewData.narrativeSummary || ''}
                        onChange={(e) => setReviewData({ ...reviewData, narrativeSummary: e.target.value || null })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={reviewData.tags?.join(', ') || ''}
                        onChange={(e) => setReviewData({ 
                          ...reviewData, 
                          tags: e.target.value ? e.target.value.split(',').map(t => t.trim()).filter(t => t) : []
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="milestone, schedule, construction"
                      />
                    </div>
                  )}

                  {/* For other model types, show generic JSON editor or specific forms */}
                  {modelType !== 'platform_unit_update' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parsed Data</label>
                        <textarea
                          rows={10}
                          value={JSON.stringify(reviewData, null, 2)}
                          onChange={(e) => {
                            try {
                              setReviewData(JSON.parse(e.target.value))
                            } catch {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                          placeholder="Parsed data will appear here..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Review and edit the parsed data (JSON format)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-4">
                    <Link
                      href="/signal/clip"
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || (modelType === 'platform_unit_update' && !unitId.trim()) || (modelType === 'platform_unit_statement' && !unitId.trim()) || (modelType === 'platform_statement' && !platformProductId.trim())}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Update'
                      )}
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
