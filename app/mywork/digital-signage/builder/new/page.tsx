'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { getDashboard } from '@/lib/dashboard.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { DigitalSignType } from '@prisma/client'
import { Award, CheckCircle2, FileText, Sparkles, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react'
import { AssetUploader } from '@/components/assets/AssetUploader'

export const dynamic = 'force-dynamic'

interface Highlight {
  id: string
  citationText: string
  achievement?: string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  photoUrl?: string | null
  employees: Array<{
    id: string
    fullName: string
    title?: string | null
    photoUrl?: string | null
  }>
  companyUnits: string[]
}

function DigitalSignageBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const signType = searchParams?.get('type') as DigitalSignType | null
  const highlightId = searchParams?.get('highlightId')
  const source = searchParams?.get('source')
  const [highlight, setHighlight] = useState<Highlight | null>(null)
  const [showHighlightSelector, setShowHighlightSelector] = useState(false)
  const [showSourceSelection, setShowSourceSelection] = useState(false)
  const [availableHighlights, setAvailableHighlights] = useState<any[]>([])
  const [loadingHighlights, setLoadingHighlights] = useState(false)
  const [highlightsLoadError, setHighlightsLoadError] = useState(false)
  const [entryMode, setEntryMode] = useState<'highlight' | 'manual' | 'ai' | null>(null)

  // Form state - Workforce Achievement
  const [personName, setPersonName] = useState('')
  const [unit, setUnit] = useState('')
  const [achievement, setAchievement] = useState('')
  const [details, setDetails] = useState('')
  // Photo URL removed - use Asset system via DigitalSignAsset on final step instead
  
  // GPT parsed output state (editable after GPT parsing)
  const [gptOutput, setGptOutput] = useState<{
    headline: string
    subhead: string | null
    detailBlock: string | null
    runtimeGuidance: string | null
    suggestedImageDescription: string | null
  } | null>(null)
  
  // Photo upload state
  const [imageAssetId, setImageAssetId] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<{ id: string; url: string; filename: string | null } | null>(null)
  
  // Existing signage state (for update flow)
  const [existingSignageId, setExistingSignageId] = useState<string | null>(null)
  const [buildingWithAI, setBuildingWithAI] = useState(false)

  // Form state - Workforce
  const [workforceTitle, setWorkforceTitle] = useState('')
  const [workforceSummary, setWorkforceSummary] = useState('')
  const [workforceBullets, setWorkforceBullets] = useState<string[]>([''])
  const [workforceImageUrl, setWorkforceImageUrl] = useState('')
  const [workforceFooterNote, setWorkforceFooterNote] = useState('')

  // Form state - Company News
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('')
  const [thumbnail, setThumbnail] = useState('')

  // Form state - Company Event
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState<string[]>([''])
  const [registrationLink, setRegistrationLink] = useState('')

  // AI generation state
  const [aiInput, setAiInput] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        
        // If highlightId is provided, load it directly
        if (highlightId) {
          loadHighlight()
          setEntryMode('highlight')
        } 
        // If source is specified, set that mode
        else if (source === 'highlight') {
          setShowHighlightSelector(true)
          setEntryMode('highlight')
          loadHighlights()
        } else if (source === 'manual') {
          setEntryMode('manual')
        } else if (source === 'ai') {
          setEntryMode('ai')
        }
        // If no source specified and no highlightId, show source selection inline
        else if (signType && !source && !highlightId) {
          setShowSourceSelection(true)
        }
      }
    }
  }, [router, highlightId, source, signType])

  async function loadHighlights(forceRefresh = false) {
    const cacheKey = 'company-highlights-digital-signage'
    const cacheTimestampKey = 'company-highlights-digital-signage-timestamp'
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

    try {
      setHighlightsLoadError(false)
      
      // Try localStorage first (instant load) unless forcing refresh
      if (!forceRefresh && typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey)
        const cachedTimestamp = localStorage.getItem(cacheTimestampKey)
        
        if (cached && cachedTimestamp) {
          const age = Date.now() - parseInt(cachedTimestamp, 10)
          if (age < CACHE_DURATION) {
            try {
              const highlights = JSON.parse(cached)
              setAvailableHighlights(highlights)
              setLoadingHighlights(false)
              // Refresh in background if stale
              if (age > CACHE_DURATION / 2) {
                refreshHighlightsFromAPI(cacheKey, cacheTimestampKey, false)
              }
              return
            } catch (parseError) {
              // localStorage data corrupted, fall through to API fetch
              console.warn('Failed to parse cached highlights, fetching from API:', parseError)
              setHighlightsLoadError(true)
            }
          }
        } else {
          // No cached data, mark as error so sync button shows
          setHighlightsLoadError(true)
        }
      }

      // If not in localStorage or forcing refresh, fetch from API
      await refreshHighlightsFromAPI(cacheKey, cacheTimestampKey, true)
    } catch (error) {
      console.error('Failed to load highlights:', error)
      setHighlightsLoadError(true)
      setAvailableHighlights([])
      setLoadingHighlights(false)
    }
  }

  async function refreshHighlightsFromAPI(cacheKey: string, cacheTimestampKey: string, showLoading: boolean) {
    if (showLoading) {
      setLoadingHighlights(true)
    }

    try {
      const response = await api.get('/api/company/highlights')
      
      if (response.data.success && response.data.highlights) {
        const highlights = response.data.highlights
        setAvailableHighlights(highlights)
        setHighlightsLoadError(false)
        
        // Cache in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(highlights))
          localStorage.setItem(cacheTimestampKey, Date.now().toString())
        }
      } else {
        setAvailableHighlights([])
        setHighlightsLoadError(true)
      }
    } catch (error: any) {
      console.error('Failed to fetch highlights from API:', error)
      setHighlightsLoadError(true)
      setAvailableHighlights([])
    } finally {
      setLoadingHighlights(false)
    }
  }

  function handleSelectHighlight(selectedHighlight: any) {
    // Load full highlight details
    setHighlight(selectedHighlight)
    setShowHighlightSelector(false)
    
    // Auto-fill form if WORKFORCE_ACHIEVEMENT
    if (signType === 'WORKFORCE_ACHIEVEMENT' && selectedHighlight.employees?.[0]) {
      const employee = selectedHighlight.employees[0]
      setPersonName(employee.fullName || '')
      setUnit(selectedHighlight.companyUnits?.[0] || '')
      setAchievement(selectedHighlight.achievement || selectedHighlight.citationText || '')
      setDetails(selectedHighlight.citationText || '')
    }
  }

  useEffect(() => {
    if (highlight && signType === 'WORKFORCE_ACHIEVEMENT') {
      const employee = highlight.employees?.[0]
      if (employee) {
        setPersonName(employee.fullName || '')
        setUnit(highlight.companyUnits?.[0] || '')
        setAchievement(highlight.achievement || highlight.citationText || '')
        setDetails(highlight.citationText || '')
        // Photo URL removed - use Asset system via DigitalSignAsset on final step instead
      }
    }
  }, [highlight, signType])

  async function loadHighlight() {
    if (!highlightId) return

    try {
      setLoading(true)
      const response = await api.get(`/api/company/highlights/${highlightId}`)
      
      if (response.data.success && response.data.highlight) {
        const h = response.data.highlight
        setHighlight(h)
        
        // Auto-fill form fields from highlight
        if (h.employees?.[0]) {
          setPersonName(h.employees[0].fullName || '')
        }
        setUnit(h.companyUnits?.[0] || '')
        setAchievement(h.achievement || h.citationText || '')
        setDetails(h.citationText || '')
      } else {
        setError(response.data.error || 'Failed to load highlight')
      }
    } catch (err: any) {
      console.error('Failed to load highlight:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load highlight')
    } finally {
      setLoading(false)
    }
  }

  async function handleBuildWithAI() {
    // Use highlight.id if available, otherwise fall back to highlightId from URL
    const idToUse = highlight?.id || highlightId
    
    if (!idToUse || !highlight) {
      setError('Highlight must be loaded first')
      return
    }

    try {
      setBuildingWithAI(true)
      setError(null)

      const response = await api.post('/api/mywork/digital-signage/build/employee-highlight', {
        highlightId: idToUse,
      })

      if (response.data.success) {
        // Set GPT output from response
        setGptOutput({
          headline: response.data.headline,
          subhead: response.data.subhead || null,
          detailBlock: response.data.detailBlock || null,
          runtimeGuidance: response.data.runtimeGuidance || '1 week',
          suggestedImageDescription: response.data.suggestedImageDescription || null,
        })
      } else {
        setError(response.data.error || 'Failed to build with AI')
      }
    } catch (err: any) {
      console.error('Failed to build with AI:', err)
      setError(err.response?.data?.error || err.message || 'Failed to build with AI')
    } finally {
      setBuildingWithAI(false)
    }
  }

  async function handleAiGeneration() {
    if (!aiInput.trim()) {
      setError('Please provide some content for AI to generate from')
      return
    }

    try {
      setAiGenerating(true)
      setError(null)
      // TODO: Implement AI generation endpoint
      // For now, just show an error
      setError('AI generation coming soon. Please use manual entry for now.')
    } catch (err: any) {
      console.error('AI generation failed:', err)
      setError(err.response?.data?.error || err.message || 'AI generation failed')
    } finally {
      setAiGenerating(false)
    }
  }


  async function handleSubmit() {
    if (!signType) {
      setError('Sign type is required')
      return
    }

    // Validate based on sign type
    if (signType === 'WORKFORCE_ACHIEVEMENT') {
      // For WORKFORCE_ACHIEVEMENT, we need GPT output (built from highlight)
      if (!gptOutput) {
        setError('Please build with AI first. Load a highlight and click "Build Digital Slide with AI".')
        return
      }
      
      if (!gptOutput.headline) {
        setError('Headline is required. Please ensure GPT output includes a headline.')
        return
      }
    } else if (signType === 'WORKFORCE') {
      if (!workforceTitle) {
        setError('Title is required')
        return
      }
    } else if (signType === 'COMPANY_NEWS') {
      if (!headline) {
        setError('Headline is required')
        return
      }
    } else if (signType === 'COMPANY_EVENT') {
      if (!eventName) {
        setError('Event name is required')
        return
      }
    }

    try {
      setSaving(true)
      setError(null)

      const payload: any = {
        signType,
        companyUnit: unit || null,
      }

      if (signType === 'WORKFORCE_ACHIEVEMENT') {
        // Use GPT output (headline, subhead, detailBlock) to save the signage
        if (!gptOutput) {
          setError('GPT output is required. Please build with AI first.')
          return
        }
        
        if (!gptOutput.headline) {
          setError('Headline is required. Please ensure GPT output includes a headline.')
          return
        }
        
        payload.workforceAchievement = {
          headline: gptOutput.headline,
          subhead: gptOutput.subhead || null,
          detailBlock: gptOutput.detailBlock || null,
          runtimeGuidance: gptOutput.runtimeGuidance || '1 week',
          imageAssetId: imageAssetId || null,
          employeeId: highlight?.employees?.[0]?.id || null,
          highlightId: highlightId || null,
        }
        
        // Include signageId if updating existing
        if (existingSignageId) {
          payload.signageId = existingSignageId
        }
      } else if (signType === 'WORKFORCE') {
        payload.workforce = {
          title: workforceTitle,
          summary: workforceSummary || null,
          bullets: workforceBullets.filter(b => b.trim()),
          imageUrl: workforceImageUrl || null,
          footerNote: workforceFooterNote || null,
        }
      } else if (signType === 'COMPANY_NEWS') {
        payload.companyNews = {
          headline,
          subheadline: subheadline || null,
          body: body || null,
          link: link || null,
          thumbnail: thumbnail || null,
        }
      } else if (signType === 'COMPANY_EVENT') {
        payload.companyEvent = {
          eventName,
          eventDate: eventDate ? new Date(eventDate).toISOString() : null,
          startTime: startTime || null,
          endTime: endTime || null,
          location: location || null,
          description: description || null,
          perks: perks.filter(p => p.trim()),
          registrationLink: registrationLink || null,
        }
      }

      const response = await api.post('/api/mywork/digital-signage/save', payload)

      if (response.data.success) {
        // Store signage ID for future updates
        if (response.data.signage?.id) {
          setExistingSignageId(response.data.signage.id)
        }
        router.push(`/mywork/digital-signage/${response.data.signage.id}`)
      } else {
        setError(response.data.error || 'Failed to save digital signage')
      }
    } catch (err: any) {
      console.error('Failed to create digital signage:', err)
      setError(err.response?.data?.error || err.message || 'Failed to create digital signage')
    } finally {
      setSaving(false)
    }
  }

  function addBullet() {
    setWorkforceBullets([...workforceBullets, ''])
  }

  function updateBullet(index: number, value: string) {
    const newBullets = [...workforceBullets]
    newBullets[index] = value
    setWorkforceBullets(newBullets)
  }

  function removeBullet(index: number) {
    setWorkforceBullets(workforceBullets.filter((_, i) => i !== index))
  }

  function addPerk() {
    setPerks([...perks, ''])
  }

  function updatePerk(index: number, value: string) {
    const newPerks = [...perks]
    newPerks[index] = value
    setPerks(newPerks)
  }

  function removePerk(index: number) {
    setPerks(perks.filter((_, i) => i !== index))
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!signType) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Invalid sign type. Please start over.
          </div>
          <Link href="/mywork/digital-signage/new" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            ← Back to Sign Type Selection
          </Link>
        </div>
      </div>
    )
  }

  const signTypeNames: Record<DigitalSignType, string> = {
    WORKFORCE: 'Workforce',
    COMPANY_NEWS: 'Company News',
    WORKFORCE_ACHIEVEMENT: 'Employee Recognition',
    COMPANY_EVENT: 'Company Event',
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
            <div className="mb-8">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Create {signTypeNames[signType]}</h1>
              <p className="text-gray-600 mt-2">Fill in the details for your digital signage</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Inline Source Selection - Show if no mode selected yet */}
            {showSourceSelection && !entryMode && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6 border-2 border-blue-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">How do you want to create this?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setShowSourceSelection(false)
                      setShowHighlightSelector(true)
                      setEntryMode('highlight')
                      loadHighlights()
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-left"
                  >
                    <Award className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">From Highlight</h3>
                    <p className="text-sm text-gray-600">Use existing employee highlight</p>
                  </button>
                  <button
                    onClick={() => {
                      setShowSourceSelection(false)
                      setEntryMode('manual')
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-left"
                  >
                    <FileText className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">Manual Entry</h3>
                    <p className="text-sm text-gray-600">Enter information manually</p>
                  </button>
                  <button
                    onClick={() => {
                      setShowSourceSelection(false)
                      setEntryMode('ai')
                    }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition text-left"
                  >
                    <Sparkles className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-900 mb-1">AI Generation</h3>
                    <p className="text-sm text-gray-600">Let AI create it</p>
                  </button>
                </div>
              </div>
            )}

            {/* Inline Highlight Selector */}
            {showHighlightSelector && (
              <div className="mb-6 bg-white rounded-lg shadow-md p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Award className="h-6 w-6 text-purple-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Select Employee Highlight</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {(highlightsLoadError || availableHighlights.length === 0) && (
                      <button
                        onClick={() => loadHighlights(true)}
                        disabled={loadingHighlights}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh highlights from database"
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingHighlights ? 'animate-spin' : ''}`} />
                        {loadingHighlights ? 'Loading...' : 'Sync'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowHighlightSelector(false)
                        router.push(`/mywork/digital-signage/builder/new?type=${signType}&source=manual`)
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Or enter manually →
                    </button>
                  </div>
                </div>
                
                {availableHighlights.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableHighlights.map((h: any) => {
                      const employee = h.employees?.[0]
                      const isSelected = highlight?.id === h.id
                      
                      return (
                        <button
                          key={h.id}
                          onClick={() => handleSelectHighlight(h)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                {isSelected && <CheckCircle2 className="h-5 w-5 text-purple-600 mr-2" />}
                                <h3 className="font-semibold text-gray-900">
                                  {employee?.fullName || 'Unknown Employee'}
                                </h3>
                                {h.awardName && (
                                  <span className="ml-3 text-sm text-gray-600">• {h.awardName}</span>
                                )}
                              </div>
                              {h.achievement && (
                                <p className="text-sm text-gray-700 mb-2">{h.achievement}</p>
                              )}
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {h.citationText?.substring(0, 150)}
                                {h.citationText?.length > 150 ? '...' : ''}
                              </p>
                              {h.awardYear && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {h.awardYear}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                      {loadingHighlights ? 'Loading highlights...' : highlightsLoadError ? 'Failed to load highlights from cache' : 'No highlights available'}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {highlightsLoadError && (
                        <button
                          onClick={() => loadHighlights(true)}
                          disabled={loadingHighlights}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingHighlights ? 'animate-spin' : ''}`} />
                          {loadingHighlights ? 'Loading...' : 'Sync Highlights'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowHighlightSelector(false)
                          router.push(`/mywork/digital-signage/builder/new?type=${signType}&source=manual`)
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        Enter Manually
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show selected highlight info */}
            {highlight && !showHighlightSelector && (
              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-900">
                      Using highlight: {highlight.employees?.[0]?.fullName || 'Unknown'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setHighlight(null)
                      setShowHighlightSelector(true)
                      setGptOutput(null)
                      // Clear form fields
                      setPersonName('')
                      setUnit('')
                      setAchievement('')
                      setDetails('')
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Change
                  </button>
                </div>
                
                {/* Show highlight details */}
                <div className="space-y-2 text-sm mb-4">
                  {highlight.employees?.[0] && (
                    <div>
                      <span className="font-medium text-gray-700">Person:</span>{' '}
                      <span className="text-gray-900">{highlight.employees[0].fullName}</span>
                    </div>
                  )}
                  {highlight.companyUnits?.[0] && (
                    <div>
                      <span className="font-medium text-gray-700">Unit:</span>{' '}
                      <span className="text-gray-900">{highlight.companyUnits[0]}</span>
                    </div>
                  )}
                  {highlight.achievement && (
                    <div>
                      <span className="font-medium text-gray-700">Achievement:</span>{' '}
                      <span className="text-gray-900">{highlight.achievement}</span>
                    </div>
                  )}
                  {highlight.citationText && (
                    <div>
                      <span className="font-medium text-gray-700">Citation:</span>
                      <p className="text-gray-900 mt-1 line-clamp-3">{highlight.citationText}</p>
                    </div>
                  )}
                </div>

                {/* Build with AI Button */}
                {!gptOutput && (
                  <button
                    onClick={handleBuildWithAI}
                    disabled={buildingWithAI || !highlight?.id}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {buildingWithAI ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Building with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Build Digital Slide with AI
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Only show form if entry mode is selected or highlight is loaded */}
            {(!showSourceSelection && (entryMode || highlight)) && (
              <>
            {entryMode === 'ai' ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Generation</h2>
                <p className="text-gray-600 mb-4">Provide raw content and AI will create the digital signage for you.</p>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Paste or type the raw content here..."
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={handleAiGeneration}
                    disabled={aiGenerating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {aiGenerating ? 'Generating...' : 'Generate Signage'}
                  </button>
                  <button
                    onClick={() => router.push(`/mywork/digital-signage/builder/new?type=${signType}&source=manual`)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Switch to Manual Entry
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                {/* For WORKFORCE_ACHIEVEMENT, manual entry is only shown when NO highlight is loaded */}
                {signType === 'WORKFORCE_ACHIEVEMENT' && !highlight && (
                  <div className="space-y-6">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> For best results, start by selecting an existing highlight above. 
                        The AI will extract all information from the highlight's citation text.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Person Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Achievement <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => setAchievement(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Details (Raw Text/JSON) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={details}
                        onChange={(e) => {
                          setDetails(e.target.value)
                          setGptOutput(null)
                        }}
                        rows={8}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Paste raw citation text, JSON, or article content here..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This raw text will be sent to GPT to extract structured data
                      </p>
                    </div>
                  </div>
                )}
                
                {/* When highlight is loaded for WORKFORCE_ACHIEVEMENT, show message to use "Build Digital Slide with AI" button above */}
                {signType === 'WORKFORCE_ACHIEVEMENT' && highlight && !gptOutput && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">
                      Highlight loaded. Use the <strong>"Build Digital Slide with AI"</strong> button above to generate signage content.
                    </p>
                  </div>
                )}

                {/* Step 2: Editable GPT Output (shown after AI build for WORKFORCE_ACHIEVEMENT) */}
                {signType === 'WORKFORCE_ACHIEVEMENT' && gptOutput && (
                  <div className="p-6 bg-green-50 border-2 border-green-300 rounded-lg space-y-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-sm font-semibold text-green-900">Step 2: Review & Edit AI Output</p>
                      </div>
                      <button
                        onClick={() => setGptOutput(null)}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        Rebuild with AI
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Headline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={gptOutput.headline}
                        onChange={(e) => setGptOutput({ ...gptOutput, headline: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subhead</label>
                      <textarea
                        value={gptOutput.subhead || ''}
                        onChange={(e) => setGptOutput({ ...gptOutput, subhead: e.target.value || null })}
                        rows={2}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Detail Block</label>
                      <input
                        type="text"
                        value={gptOutput.detailBlock || ''}
                        onChange={(e) => setGptOutput({ ...gptOutput, detailBlock: e.target.value || null })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., NAVSEA Excellence Award · 2025"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Runtime Guidance</label>
                      <input
                        type="text"
                        value={gptOutput.runtimeGuidance || '1 week'}
                        onChange={(e) => setGptOutput({ ...gptOutput, runtimeGuidance: e.target.value || null })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {gptOutput.suggestedImageDescription && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs font-medium text-blue-900 mb-1">GPT Suggestion:</p>
                        <p className="text-xs text-blue-700">{gptOutput.suggestedImageDescription}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Photo Upload (shown after AI build for WORKFORCE_ACHIEVEMENT) */}
                {signType === 'WORKFORCE_ACHIEVEMENT' && gptOutput && (
                  <div className="p-6 bg-purple-50 border-2 border-purple-300 rounded-lg mb-6">
                    <div className="flex items-center mb-4">
                      <ImageIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <p className="text-sm font-semibold text-purple-900">Step 3: Add Photo (Optional)</p>
                    </div>
                    <AssetUploader
                      onUploaded={(asset) => {
                        setImageAssetId(asset.id)
                        setUploadedImage(asset)
                      }}
                    />
                    {uploadedImage && (
                      <div className="mt-4 p-3 bg-white border border-purple-200 rounded-lg">
                        <p className="text-xs text-green-600 font-medium mb-2">✓ Photo uploaded successfully!</p>
                        <img 
                          src={uploadedImage.url} 
                          alt={uploadedImage.filename || 'Uploaded image'} 
                          className="h-32 rounded-lg object-cover"
                        />
                        <p className="text-xs text-gray-600 mt-2">{uploadedImage.filename}</p>
                      </div>
                    )}
                  </div>
                )}

                {signType === 'WORKFORCE' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={workforceTitle}
                        onChange={(e) => setWorkforceTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
                      <textarea
                        value={workforceSummary}
                        onChange={(e) => setWorkforceSummary(e.target.value)}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bullet Points</label>
                      {workforceBullets.map((bullet, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateBullet(index, e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Bullet point ${index + 1}`}
                          />
                          {workforceBullets.length > 1 && (
                            <button
                              onClick={() => removeBullet(index)}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addBullet}
                        className="mt-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        + Add Bullet Point
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                      <input
                        type="url"
                        value={workforceImageUrl}
                        onChange={(e) => setWorkforceImageUrl(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Footer Note</label>
                      <input
                        type="text"
                        value={workforceFooterNote}
                        onChange={(e) => setWorkforceFooterNote(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {signType === 'COMPANY_NEWS' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Headline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subheadline</label>
                      <input
                        type="text"
                        value={subheadline}
                        onChange={(e) => setSubheadline(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL</label>
                      <input
                        type="url"
                        value={thumbnail}
                        onChange={(e) => setThumbnail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}

                {signType === 'COMPANY_EVENT' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Perks</label>
                      {perks.map((perk, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={perk}
                            onChange={(e) => updatePerk(index, e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Perk ${index + 1}`}
                          />
                          {perks.length > 1 && (
                            <button
                              onClick={() => removePerk(index)}
                              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addPerk}
                        className="mt-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        + Add Perk
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Registration Link</label>
                      <input
                        type="url"
                        value={registrationLink}
                        onChange={(e) => setRegistrationLink(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Save Button - only show after GPT output for WORKFORCE_ACHIEVEMENT */}
                {signType === 'WORKFORCE_ACHIEVEMENT' && !gptOutput ? null : (
                  <div className="mt-8 flex space-x-4">
                    <button
                      onClick={handleSubmit}
                      disabled={saving || (signType === 'WORKFORCE_ACHIEVEMENT' && !gptOutput)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : existingSignageId ? 'Update Digital Signage' : 'Save Digital Signage'}
                    </button>
                    <button
                      onClick={() => router.back()}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DigitalSignageBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DigitalSignageBuilderContent />
    </Suspense>
  )
}
