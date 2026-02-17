'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
import api from '@/lib/api'
import EmailDigestSidebar from '@/components/workforce/EmailDigestSidebar'

const VALID_SOURCE_TYPES = ['CompanyEvent', 'CompanyCampaign', 'CompanyTraining', 'CompanyBenefits', 'CompanyImpactEvent', 'CompanyCommunity', 'CompanyCareer', 'CompanyEmployeeCause']

function CreateItemContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const urlSourceType = searchParams?.get('sourceType')
  const urlSourceId = searchParams?.get('sourceId')
  const [sourceMode, setSourceMode] = useState<'workforce' | 'manual'>('workforce')
  const [sourceType, setSourceType] = useState(urlSourceType && VALID_SOURCE_TYPES.includes(urlSourceType) ? urlSourceType : 'CompanyEvent')
  const [sourceItems, setSourceItems] = useState<any[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState(urlSourceId ?? '')
  const [selectedItem, setSelectedItem] = useState<any>(null) // The actual selected item data
  const [manualInput, setManualInput] = useState('')
  
  // Human context for AI
  const [humanContext, setHumanContext] = useState('')
  const [rawTextOverride, setRawTextOverride] = useState('') // Paste missing raw text here!
  
  // Formatted content (what the AI generates)
  const [formattedContent, setFormattedContent] = useState({
    title: '', // For searchability
    content: '', // The ENTIRE formatted item
  })

  // Sync URL params to state when landing from work products "Add to digest"
  useEffect(() => {
    if (urlSourceType && VALID_SOURCE_TYPES.includes(urlSourceType)) {
      setSourceType(urlSourceType)
      setSourceMode('workforce')
    }
    if (urlSourceId) setSelectedSourceId(urlSourceId)
  }, [urlSourceType, urlSourceId])

  useEffect(() => {
    async function fetchWorkForceItems() {
      if (sourceMode !== 'workforce' || !session.firebaseId) return

      try {
        console.log('🔍 Fetching workforce items for type:', sourceType)
        const response = await api.get('/api/workforce/companyx/items', {
          params: { type: sourceType }
        })
        console.log('📥 API Response:', {
          success: response.data.success,
          items: response.data.items,
          count: response.data.count,
          fullResponse: response.data
        })
        
        if (response.data.success) {
          const items = response.data.items?.[sourceType] || []
          console.log(`✅ Found ${items.length} items of type ${sourceType}`)
          setSourceItems(items)
        } else {
          console.error('❌ API returned success:false', response.data)
          setSourceItems([])
        }
      } catch (error: any) {
        console.error('❌ Error fetching WorkForce items:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        setSourceItems([])
      }
    }
    fetchWorkForceItems()
  }, [sourceMode, sourceType, session.firebaseId])

  // Hydrate selected item data when selection changes
  useEffect(() => {
    if (selectedSourceId) {
      const item = sourceItems.find(i => i.id === selectedSourceId)
      setSelectedItem(item || null)
    } else {
      setSelectedItem(null)
    }
  }, [selectedSourceId, sourceItems])

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
        // sourceData is ALREADY PARSED (title, description, pocEmail, etc.)
        // If rawTextOverride provided, merge it in!
        const dataToSend = rawTextOverride 
          ? { ...selectedItem, ingestRawText: rawTextOverride }
          : selectedItem
        
        console.log('🚀 Calling generate API with:', { sourceType, selectedSourceId, humanContext })
        
        const response = await api.post('/api/workforce/enduring/email-digest/items/generate', {
          sourceType,
          sourceId: selectedSourceId,
          sourceData: dataToSend, // Already has title, description, POC fields!
          humanContext, // User's instructions to AI
        })

        console.log('📥 Generate API response:', {
          success: response.data.success,
          hasFormattedContent: !!response.data.formattedContent,
          formattedContent: response.data.formattedContent,
        })

        if (response.data.success && response.data.formattedContent) {
          console.log('✅ Setting formatted content:', response.data.formattedContent)
          setFormattedContent(response.data.formattedContent)
        } else {
          console.error('❌ Generate failed:', response.data)
          alert('❌ AI Generation Failed\n\n' + (response.data.error || 'Unknown error') + '\n\n' + (response.data.details || ''))
        }
      } else if (sourceMode === 'manual' && manualInput) {
        // Call AI generator with manual input (raw blob - needs parsing)
        const response = await api.post('/api/workforce/enduring/email-digest/items/generate', {
          sourceType: 'manual',
          sourceId: null,
          sourceData: { rawText: manualInput }, // Raw text blob
          humanContext, // User's instructions
        })

        if (response.data.success && response.data.formattedContent) {
          setFormattedContent(response.data.formattedContent)
        } else {
          alert('Error generating item: ' + (response.data.error || 'Unknown error'))
        }
      }
    } catch (error: any) {
      console.error('Error generating item:', error)
      const errorMsg = error.response?.data?.error || error.response?.data?.details || error.message
      alert('❌ AI Generation Failed\n\n' + errorMsg + '\n\nAI features may not be available. Check configuration.')
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

      <div className="flex">
        <EmailDigestSidebar />
        <div className="flex-1">
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

              {/* Explainer */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">How it works:</h3>
                    <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                      <li><strong>Select a category</strong> (Events, Campaigns, Training, etc.) - this loads items from that category</li>
                      <li><strong>Pick a specific item</strong> - the raw text is automatically loaded</li>
                      <li><strong>AI formats it</strong> - generates a formatted digest item</li>
                      <li><strong>Edit & save</strong> - refine the output and save to your catalogue</li>
                    </ol>
                  </div>
                </div>
              </div>

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
                      Select from company events, campaigns, trainings, etc. The raw text is automatically loaded.
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

              {/* MOVE DROPDOWNS HERE - BEFORE HYDRATION */}
              {sourceMode === 'workforce' && (
                <>
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Select Category</h2>
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
                    <p className="text-xs text-gray-500 mt-2">
                      This loads all items from the selected category below
                    </p>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">3. Select Specific Item:</h3>
                    {sourceItems.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-yellow-900 mb-1">
                              No {sourceType.replace('Company', '')} items found
                            </p>
                            <p className="text-sm text-yellow-800 mb-2">
                              You need to create {sourceType.replace('Company', '').toLowerCase()} items from workstuff first.
                            </p>
                            <Link
                              href="/mycompany/workforcestuff/add"
                              className="text-sm text-yellow-900 underline font-medium hover:text-yellow-700"
                            >
                              → Go to Workstuff to create items
                            </Link>
                            <p className="text-xs text-yellow-700 mt-2">
                              Or use "Manual Entry" mode below to paste content directly.
                            </p>
                          </div>
                        </div>
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
                </>
              )}

              {/* HYDRATED DATA PREVIEW - NOW APPEARS BELOW DROPDOWNS */}
              {selectedItem && (
                <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Source Data (What AI Will Use)</h3>
                  <div className="space-y-3 text-sm">
                    <div><span className="font-medium">Title:</span> {selectedItem.title || 'N/A'}</div>
                    
                    {selectedItem.summary && (
                      <details>
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                          Summary: {selectedItem.summary.substring(0, 80)}...
                        </summary>
                        <div className="mt-2 bg-white p-3 rounded border border-gray-300 whitespace-pre-wrap">
                          {selectedItem.summary}
                        </div>
                      </details>
                    )}
                    
                    {selectedItem.description && (
                      <details>
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                          Description: {selectedItem.description.substring(0, 80)}...
                        </summary>
                        <div className="mt-2 bg-white p-3 rounded border border-gray-300 whitespace-pre-wrap">
                          {selectedItem.description}
                        </div>
                      </details>
                    )}
                    
                    {(selectedItem.pocFirstName || selectedItem.pocLastName || selectedItem.pocEmail) && (
                      <div>
                        <span className="font-medium">POC:</span> {[selectedItem.pocFirstName, selectedItem.pocLastName].filter(Boolean).join(' ')} {selectedItem.pocEmail && `(${selectedItem.pocEmail})`}
                      </div>
                    )}
                    
                    {selectedItem.effectiveDate && (
                      <div><span className="font-medium">Effective Date:</span> {new Date(selectedItem.effectiveDate).toLocaleDateString()}</div>
                    )}
                    
                    {selectedItem.urgency && (
                      <div><span className="font-medium text-red-600">⚠️ Urgency:</span> {selectedItem.urgency}</div>
                    )}
                    
                    {selectedItem.impactedPopulation && (
                      <div><span className="font-medium">Impacted:</span> {selectedItem.impactedPopulation}</div>
                    )}
                    
                    {selectedItem.ingestRawText ? (
                      <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-300 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-purple-900">📄 FULL RAW TEXT (All Details, Deadlines, Codes)</span>
                          <span className="text-xs text-purple-700">← AI uses this!</span>
                        </div>
                        <pre className="text-xs bg-white p-3 rounded border border-purple-200 overflow-auto max-h-64 whitespace-pre-wrap">
                          {selectedItem.ingestRawText}
                        </pre>
                        <p className="text-xs text-purple-700 mt-2">
                          ⚠️ Summary/description above are simplified - THIS has the deadlines, codes, and all critical info
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                        ⚠️ No raw text available - parser may have left out deadlines and codes!
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Human Context - Instructions for AI */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for AI <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={humanContext}
                  onChange={(e) => setHumanContext(e.target.value)}
                  placeholder="e.g., 'Emphasize the deadline', 'This is urgent', 'Keep it casual', etc."
                  className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Give the AI context about tone, urgency, or what to emphasize
                </p>
              </div>

              {/* Raw Text Override - For missing data */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📄 Raw Text Override <span className="text-gray-500">(if source is missing details)</span>
                </label>
                <textarea
                  value={rawTextOverride}
                  onChange={(e) => setRawTextOverride(e.target.value)}
                  placeholder="Paste the full raw text here if the source is missing deadlines, codes, or other critical details..."
                  className="w-full h-32 px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-xs font-mono bg-purple-50"
                />
                <p className="mt-1 text-xs text-purple-700">
                  ⚡ This overrides the source's raw text - AI will use THIS instead
                </p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-gray-500 text-xs">(for searchability)</span>
                  </label>
                  <input
                    type="text"
                    value={formattedContent.title}
                    onChange={(e) => setFormattedContent({ ...formattedContent, title: e.target.value })}
                    placeholder="*ACTION REQUIRED*: TIMEKEEPING GUIDANCE..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content <span className="text-gray-500 text-xs">(the complete formatted item)</span>
                  </label>
                  <textarea
                    value={formattedContent.content}
                    onChange={(e) => setFormattedContent({ ...formattedContent, content: e.target.value })}
                    placeholder="The entire formatted item with title, POC, body, CTA all together..."
                    className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This is what will appear in the final digest. Edit as needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview */}
            {formattedContent.content && (
              <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-4 uppercase">Preview</h3>
                <div className="bg-white rounded p-4 text-sm">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed text-gray-900">
                    {formattedContent.content}
                  </pre>
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
      </div>
    </div>
  )
}

export default function CreateItemPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <CreateItemContent />
    </Suspense>
  )
}
