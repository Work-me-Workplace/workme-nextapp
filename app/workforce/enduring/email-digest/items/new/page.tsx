'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
import api from '@/lib/api'

export default function CreateItemPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sourceMode, setSourceMode] = useState<'workforce' | 'manual'>('workforce')
  const [sourceType, setSourceType] = useState('CompanyEvent')
  const [sourceItems, setSourceItems] = useState<any[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [manualInput, setManualInput] = useState('')
  
  // Formatted content (what the AI would generate)
  const [formattedContent, setFormattedContent] = useState({
    title: '',
    poc: '',
    body: '',
    cta: '',
    ctaUrl: '',
  })

  useEffect(() => {
    async function fetchWorkForceItems() {
      if (sourceMode !== 'workforce' || !session.firebaseId) return

      try {
        const response = await api.get('/api/workforce/companyx/items', {
          params: { type: sourceType }
        })
        if (response.data.success) {
          const items = response.data.items[sourceType] || []
          setSourceItems(items)
        }
      } catch (error) {
        console.error('Error fetching WorkForce items:', error)
        setSourceItems([])
      }
    }
    fetchWorkForceItems()
  }, [sourceMode, sourceType, session.firebaseId])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session.firebaseId) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      if (sourceMode === 'workforce' && selectedSourceId) {
        // Find the selected item
        const selectedItem = sourceItems.find(item => item.id === selectedSourceId)
        if (!selectedItem) {
          alert('Please select an item first')
          setLoading(false)
          return
        }

        // Call the REAL AI generator service
        const response = await api.post('/api/workforce/enduring/email-digest/items/generate', {
          sourceType,
          sourceId: selectedSourceId,
          sourceData: selectedItem,
        })

        if (response.data.success && response.data.formattedContent) {
          setFormattedContent(response.data.formattedContent)
        } else {
          alert('Error generating item: ' + (response.data.error || 'Unknown error'))
        }
      } else if (sourceMode === 'manual' && manualInput) {
        // Call AI generator with manual input
        const response = await api.post('/api/workforce/enduring/email-digest/items/generate', {
          sourceType: 'manual',
          sourceId: null,
          sourceData: { rawText: manualInput },
        })

        if (response.data.success && response.data.formattedContent) {
          setFormattedContent(response.data.formattedContent)
        } else {
          alert('Error generating item: ' + (response.data.error || 'Unknown error'))
        }
      }
    } catch (error: any) {
      console.error('Error generating item:', error)
      alert('Error generating item: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (status: 'DRAFT' | 'READY') => {
    if (!formattedContent.title) {
      alert('Please generate content first')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/workforce/enduring/email-digest/items', {
        sourceType: sourceMode === 'workforce' ? sourceType : 'manual',
        sourceId: selectedSourceId || null,
        formattedContent,
        status,
      })

      if (response.data.success) {
        router.push('/workforce/enduring/email-digest/items')
      } else {
        alert('Error saving item: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Error saving item:', error)
      alert('Error saving item: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce/enduring/email-digest" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/workforce/enduring/email-digest/items"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to Item Catalogue
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Digest Item</h1>
        <p className="text-gray-600 mb-8">Build a formatted item for your email digests</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Source Selection & Generation */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Source</h2>

              <div className="space-y-4">
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    checked={sourceMode === 'workforce'}
                    onChange={() => setSourceMode('workforce')}
                    className="mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-semibold text-gray-900">From WorkForce Stuff</div>
                    <div className="text-sm text-gray-600">
                      Select from company events, campaigns, trainings, etc.
                    </div>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="radio"
                    checked={sourceMode === 'manual'}
                    onChange={() => setSourceMode('manual')}
                    className="mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-semibold text-gray-900">Manual Entry</div>
                    <div className="text-sm text-gray-600">Write or paste content directly</div>
                  </div>
                </label>
              </div>
            </div>

            {sourceMode === 'workforce' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Select Item Type</h2>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CompanyEvent">Events</option>
                  <option value="CompanyCampaign">Campaigns</option>
                  <option value="CompanyTraining">Training</option>
                  <option value="CompanyBenefits">Benefits</option>
                  <option value="CompanyImpactEvent">Impact Events</option>
                  <option value="CompanyCommunity">Community</option>
                  <option value="CompanyCareer">Careers</option>
                  <option value="CompanyEmployeeCause">Employee Causes</option>
                </select>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Select Specific Item:</h3>
                  {sourceItems.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">
                        No {sourceType.replace('Company', '')} items found. Try another type or use manual entry.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedSourceId}
                      onChange={(e) => setSelectedSourceId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select an item --</option>
                      {sourceItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title || 'Untitled'} 
                          {item.eventDate && ` (${new Date(item.eventDate).toLocaleDateString()})`}
                          {item.trainingDate && ` (${new Date(item.trainingDate).toLocaleDateString()})`}
                          {item.windowStart && ` (${new Date(item.windowStart).toLocaleDateString()})`}
                          {item.date && ` (${new Date(item.date).toLocaleDateString()})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {sourceMode === 'manual' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Enter Content</h2>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste or type your content here..."
                  className="w-full h-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || (sourceMode === 'manual' && !manualInput) || (sourceMode === 'workforce' && !selectedSourceId)}
              className="w-full bg-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  ✨ Generate Formatted Item
                </>
              )}
            </button>
          </div>

          {/* RIGHT: Preview & Edit */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Review & Edit</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title/Headline</label>
                  <input
                    type="text"
                    value={formattedContent.title}
                    onChange={(e) => setFormattedContent({ ...formattedContent, title: e.target.value })}
                    placeholder="*REMINDER*: EVENT NAME – DEC. 11"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POC Line</label>
                  <input
                    type="text"
                    value={formattedContent.poc}
                    onChange={(e) => setFormattedContent({ ...formattedContent, poc: e.target.value })}
                    placeholder="POC: Name at email@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                  <textarea
                    value={formattedContent.body}
                    onChange={(e) => setFormattedContent({ ...formattedContent, body: e.target.value })}
                    placeholder="Main content goes here..."
                    className="w-full h-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call to Action</label>
                  <input
                    type="text"
                    value={formattedContent.cta}
                    onChange={(e) => setFormattedContent({ ...formattedContent, cta: e.target.value })}
                    placeholder="Register here by Dec. 8"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL (optional)</label>
                  <input
                    type="text"
                    value={formattedContent.ctaUrl}
                    onChange={(e) => setFormattedContent({ ...formattedContent, ctaUrl: e.target.value })}
                    placeholder="/events/register"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {formattedContent.title && (
              <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-4 uppercase">Preview</h3>
                <div className="bg-white rounded p-4 text-sm space-y-3">
                  <p className="font-bold">{formattedContent.title}</p>
                  {formattedContent.poc && <p className="text-gray-700">{formattedContent.poc}</p>}
                  {formattedContent.body && <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{formattedContent.body}</p>}
                  {formattedContent.cta && (
                    <p className="text-blue-600 underline cursor-pointer">{formattedContent.cta}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={loading || !formattedContent.title}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave('READY')}
                disabled={loading || !formattedContent.title}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save as Ready
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
