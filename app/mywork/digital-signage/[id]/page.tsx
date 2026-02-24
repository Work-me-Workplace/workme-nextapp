'use client'

import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { Monitor, ArrowLeft, CheckCircle2, X, Package, Loader2, Archive, FileText, ExternalLink, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface DigitalSignage {
  id: string
  signType: string
  companyUnit?: string | null
  createdAt: string
  workforceAchievement?: {
    headline: string
    subhead?: string | null
    factualStatement?: string | null
    quote?: string | null
    quoteAttribution?: string | null
    runtimeGuidance?: string | null
    imageAsset?: {
      id: string
      url: string
      filename?: string | null
    } | null
  } | null
  workforce?: {
    title: string
    summary?: string | null
    bullets: string[]
    imageUrl?: string | null
    footerNote?: string | null
  } | null
  companyNews?: {
    headline: string
    subheadline?: string | null
    body?: string | null
    link?: string | null
    thumbnail?: string | null
  } | null
  companyEvent?: {
    eventName: string
    eventDate?: string | null
    startTime?: string | null
    endTime?: string | null
    location?: string | null
    description?: string | null
    eventItems: string[]
    registrationLink?: string | null
  } | null
  workforceStuff?: {
    title: string | null
    description?: string | null
    date?: string | null
    endDate?: string | null
    startTime?: string | null
    endTime?: string | null
    location?: string | null
    eventItems: string[]
    eventName?: string | null
    registrationLink?: string | null
  } | null
  // Gamma deck generation
  gammaStatus?: string | null
  gammaDeckUrl?: string | null
  gammaPptxUrl?: string | null
  gammaGenerationId?: string | null
  gammaError?: string | null
  gammaBlob?: string | null
}

function DigitalSignageViewContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const signageId = params?.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [signage, setSignage] = useState<DigitalSignage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [buildingDeck, setBuildingDeck] = useState(false)
  const [gammaStatus, setGammaStatus] = useState<string | null>(null)
  const [gammaDeckUrl, setGammaDeckUrl] = useState<string | null>(null)
  const [gammaPptxUrl, setGammaPptxUrl] = useState<string | null>(null)
  const [gammaGenerationId, setGammaGenerationId] = useState<string | null>(null)
  const [showDeckStatus, setShowDeckStatus] = useState(false)
  const [gammaDetails, setGammaDetails] = useState('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [lastPayloadChars, setLastPayloadChars] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        // Check if we just saved (from URL param or localStorage)
        const saved = searchParams?.get('saved') === 'true'
        const fromSave = typeof window !== 'undefined' && localStorage.getItem('digitalSignageJustSaved') === signageId
        if (saved || fromSave) {
          setShowSuccess(true)
          if (fromSave) {
            localStorage.removeItem('digitalSignageJustSaved')
          }
        }
        loadSignage()
      }
    }
  }, [router, signageId, searchParams])

  // Auto-fill Gamma text from sign content (workforce context) when the sign has content
  const hasSignContent =
    signage?.workforce ||
    signage?.companyEvent ||
    signage?.workforceStuff ||
    signage?.companyNews ||
    signage?.workforceAchievement
  useEffect(() => {
    if (!signageId || !signage?.id || !hasSignContent) return
    let cancelled = false
    async function fillFromSign() {
      try {
        const res = await api.get(
          `/api/decks/digital-signage/preview?digitalSignId=${signageId}`
        )
        if (cancelled) return
        if (res.data.success && res.data.preview && typeof res.data.preview === 'string') {
          setGammaDetails((prev) => (prev === '' ? res.data.preview : prev))
        }
      } catch {
        // ignore; user can still click "Load from sign"
      }
    }
    fillFromSign()
    return () => {
      cancelled = true
    }
  }, [signageId, signage?.id, hasSignContent])

  // Poll Gamma deck status when generating
  useEffect(() => {
    if (gammaStatus !== 'generating' || !gammaGenerationId || !signageId) return
    const interval = setInterval(async () => {
      try {
        const res = await api.get(
          `/api/decks/status/${gammaGenerationId}?digitalSignId=${signageId}`
        )
        if (res.data.success) {
          if (res.data.status === 'ready') {
            setGammaStatus('ready')
            setGammaDeckUrl(res.data.url ?? null)
            setGammaPptxUrl(res.data.pptxUrl ?? null)
            clearInterval(interval)
            return
          }
          if (res.data.status === 'error' || res.data.status === 'failed') {
            setGammaStatus('error')
            clearInterval(interval)
          }
        }
      } catch {
        setGammaStatus('error')
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [gammaStatus, gammaGenerationId, signageId])

  async function loadSignage() {
    if (!signageId) return

    try {
      setLoading(true)
      const response = await api.get(`/api/digital-signage/${signageId}`)
      
      if (response.data.success && response.data.signage) {
        const s = response.data.signage
        setSignage(s)
        setGammaStatus(s.gammaStatus ?? null)
        setGammaDeckUrl(s.gammaDeckUrl ?? null)
        setGammaPptxUrl(s.gammaPptxUrl ?? null)
        setGammaGenerationId(s.gammaGenerationId ?? null)
        if (s.gammaStatus || s.gammaDeckUrl || s.gammaPptxUrl) setShowDeckStatus(true)
        if (s.gammaBlob != null) setLastPayloadChars(s.gammaBlob.length)
      } else {
        setError(response.data.error || 'Failed to load digital signage')
      }
    } catch (err: any) {
      console.error('Failed to load digital signage:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load digital signage')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignToDesignPackage() {
    if (!signageId) return

    setAssigning(true)
    setAssignError(null)

    try {
      const response = await api.post('/api/mywork/designworkpackage/create', {
        digitalSignId: signageId,
        title: signage?.workforceAchievement?.headline || signage?.workforce?.title || signage?.companyNews?.headline || signage?.companyEvent?.eventName || 'Digital Signage Design',
        description: `Design work package for ${signage?.signType.replace('_', ' ')} digital signage`,
      })

      if (response.data.success) {
        // Show success and optionally redirect
        alert('Design work package created successfully!')
        // Could redirect to work package page if it exists
      } else {
        setAssignError(response.data.error || 'Failed to create design work package')
      }
    } catch (err: any) {
      console.error('Failed to assign to design package:', err)
      setAssignError(err.response?.data?.error || err.message || 'Failed to create design work package')
    } finally {
      setAssigning(false)
    }
  }

  async function handleLoadPreview() {
    if (!signageId) return
    setLoadingPreview(true)
    try {
      const res = await api.get(
        `/api/decks/digital-signage/preview?digitalSignId=${signageId}`
      )
      if (res.data.success && res.data.preview) {
        setGammaDetails(res.data.preview)
      }
    } catch {
      setError('Could not load preview from signage')
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleGenerateDeck() {
    if (!signageId) return
    setBuildingDeck(true)
    setShowDeckStatus(true)
    setError(null)
    try {
      const res = await api.post('/api/decks/digital-signage/generate', {
        digitalSignId: signageId,
        ...(gammaDetails.trim() ? { detailsForGamma: gammaDetails.trim() } : {}),
      })
      if (res.data.success) {
        if (typeof res.data.payloadChars === 'number') {
          setLastPayloadChars(res.data.payloadChars)
        }
        if (res.data.status === 'ready') {
          setGammaStatus('ready')
          setGammaDeckUrl(res.data.deckUrl ?? null)
          setGammaPptxUrl(res.data.pptxUrl ?? null)
        } else if (res.data.status === 'generating' && res.data.generationId) {
          setGammaStatus('generating')
          setGammaGenerationId(res.data.generationId)
        }
      } else {
        setGammaStatus('error')
        setError(res.data.error ?? res.data.details ?? 'Failed to generate deck')
      }
    } catch (err: any) {
      setGammaStatus('error')
      setError(
        err.response?.data?.error ??
          err.response?.data?.details ??
          err.message ??
          'Failed to generate deck'
      )
    } finally {
      setBuildingDeck(false)
    }
  }

  async function handleArchive() {
    if (!signageId) return

    if (!confirm('Are you sure you want to archive this digital signage? It will be moved to archived items.')) {
      return
    }

    setArchiving(true)
    setArchiveError(null)

    try {
      const response = await api.post(`/api/mywork/digital-signage/${signageId}/archive`)

      if (response.data.success) {
        // Redirect to list page
        router.push('/mywork/digital-signage')
      } else {
        setArchiveError(response.data.error || 'Failed to archive digital signage')
      }
    } catch (err: any) {
      console.error('Failed to archive:', err)
      setArchiveError(err.response?.data?.error || err.message || 'Failed to archive digital signage')
    } finally {
      setArchiving(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !signage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Digital signage not found'}
          </div>
          <Link href="/mywork" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            ← Back to MyWork
          </Link>
        </div>
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
              href="/mywork"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to MyWork
            </Link>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Digital Signage</h1>
                    <p className="text-blue-100">{signage.signType.replace('_', ' ')}</p>
                  </div>
                  <Monitor className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="px-8 py-6">
                {/* Build a deck from this sign (Gamma) */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-slate-50 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Build a presentation from this sign
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Turn this digital sign into a Gamma deck or PowerPoint. The text below is what we send to Gamma. Leave it blank to auto-fill from this sign’s content, or edit it first. Then click to send—you’ll see a confirmation that the payload was sent.
                  </p>
                  <textarea
                    value={gammaDetails}
                    onChange={(e) => setGammaDetails(e.target.value)}
                    placeholder="Leave blank to use this sign’s content, or enter your own title and bullet points..."
                    rows={6}
                    className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadPreview}
                      disabled={loadingPreview}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      {loadingPreview ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : null}
                      Load from sign
                    </button>
                    <button
                      onClick={handleGenerateDeck}
                      disabled={buildingDeck || gammaStatus === 'generating'}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {buildingDeck || gammaStatus === 'generating' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Send to Gamma
                        </>
                      )}
                    </button>
                    {lastPayloadChars != null && (
                      <span className="text-xs text-gray-500 ml-1">
                        Last sent: {lastPayloadChars.toLocaleString()} characters
                      </span>
                    )}
                  </div>
                </div>

                {showDeckStatus && (gammaStatus || gammaDeckUrl || gammaPptxUrl) && (
                  <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      {gammaStatus === 'ready'
                        ? 'Deck ready'
                        : gammaStatus === 'generating'
                          ? 'Generating deck...'
                          : 'Deck generation failed'}
                    </h3>
                    {gammaStatus === 'ready' && (
                      <div className="flex flex-wrap gap-3">
                        {gammaDeckUrl && (
                          <a
                            href={gammaDeckUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View deck (Gamma)
                          </a>
                        )}
                        {gammaPptxUrl && (
                          <a
                            href={gammaPptxUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            <Download className="h-4 w-4" />
                            Download PPTX
                          </a>
                        )}
                      </div>
                    )}
                    {gammaStatus === 'generating' && (
                      <p className="text-sm text-blue-700">
                        Gamma is generating your presentation. This may take a minute.
                      </p>
                    )}
                    {gammaStatus === 'error' && (
                      <p className="text-sm text-red-700">
                        Deck generation failed. Please try again.
                      </p>
                    )}
                  </div>
                )}
                {showSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-semibold text-green-900">Digital Signage Saved Successfully!</p>
                        <p className="text-xs text-green-700">Your digital signage has been created and is ready to use.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSuccess(false)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {signage.workforceAchievement && (
                  <div className="space-y-6">
                    {signage.workforceAchievement.imageAsset?.url && (
                      <div className="text-center">
                        <img 
                          src={signage.workforceAchievement.imageAsset.url} 
                          alt={signage.workforceAchievement.headline}
                          className="mx-auto rounded-lg max-w-md w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {signage.workforceAchievement.headline}
                      </h2>
                      {signage.workforceAchievement.subhead && (
                        <p className="text-xl text-gray-600 mb-4">{signage.workforceAchievement.subhead}</p>
                      )}
                    </div>
                    {signage.workforceAchievement.factualStatement && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Details</h3>
                        <p className="text-gray-700 text-lg">{signage.workforceAchievement.factualStatement}</p>
                      </div>
                    )}
                    {signage.workforceAchievement.quote && (
                      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                        <p className="text-gray-700 text-lg italic">"{signage.workforceAchievement.quote}"</p>
                        {signage.workforceAchievement.quoteAttribution && (
                          <p className="text-gray-600 text-sm mt-2">— {signage.workforceAchievement.quoteAttribution}</p>
                        )}
                      </div>
                    )}
                    {signage.workforceAchievement.runtimeGuidance && (
                      <div className="text-sm text-gray-500">
                        <p>Display duration: {signage.workforceAchievement.runtimeGuidance}</p>
                      </div>
                    )}
                  </div>
                )}

                {signage.workforce && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{signage.workforce.title}</h2>
                      {signage.workforce.summary && (
                        <p className="text-gray-700 text-lg mb-4">{signage.workforce.summary}</p>
                      )}
                    </div>
                    {signage.workforce.bullets.length > 0 && (
                      <div>
                        <ul className="list-disc list-inside space-y-2">
                          {signage.workforce.bullets.map((bullet, index) => (
                            <li key={index} className="text-gray-700">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {signage.workforce.imageUrl && (
                      <div>
                        <img 
                          src={signage.workforce.imageUrl} 
                          alt={signage.workforce.title}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                    {signage.workforce.footerNote && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">{signage.workforce.footerNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {signage.companyNews && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {signage.companyNews.headline}
                      </h2>
                      {signage.companyNews.subheadline && (
                        <p className="text-xl text-gray-600 mb-4">{signage.companyNews.subheadline}</p>
                      )}
                    </div>
                    {signage.companyNews.thumbnail && (
                      <div>
                        <img 
                          src={signage.companyNews.thumbnail} 
                          alt={signage.companyNews.headline}
                          className="w-full rounded-lg"
                        />
                      </div>
                    )}
                    {signage.companyNews.body && (
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                          {signage.companyNews.body}
                        </p>
                      </div>
                    )}
                    {signage.companyNews.link && (
                      <div>
                        <a 
                          href={signage.companyNews.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Learn More →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {signage.companyEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {signage.companyEvent.eventName}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {signage.companyEvent.eventDate && (
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="text-lg font-medium text-gray-900">
                            {new Date(signage.companyEvent.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {(signage.companyEvent.startTime || signage.companyEvent.endTime) && (
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="text-lg font-medium text-gray-900">
                            {signage.companyEvent.startTime && signage.companyEvent.endTime
                              ? `${signage.companyEvent.startTime} - ${signage.companyEvent.endTime}`
                              : signage.companyEvent.startTime || signage.companyEvent.endTime}
                          </p>
                        </div>
                      )}
                      {signage.companyEvent.location && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-lg font-medium text-gray-900">{signage.companyEvent.location}</p>
                        </div>
                      )}
                    </div>
                    {signage.companyEvent.description && (
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                          {signage.companyEvent.description}
                        </p>
                      </div>
                    )}
                    {signage.companyEvent.eventItems.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Perks</h3>
                        <ul className="list-disc list-inside space-y-2">
                          {signage.companyEvent.eventItems.map((item, index) => (
                            <li key={index} className="text-gray-700">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {signage.companyEvent.registrationLink && (
                      <div>
                        <a 
                          href={signage.companyEvent.registrationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          Register Now →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {signage.workforceStuff && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {signage.workforceStuff.title || signage.workforceStuff.eventName || 'Workforce'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {signage.workforceStuff.date && (
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="text-lg font-medium text-gray-900">
                            {new Date(signage.workforceStuff.date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {signage.workforceStuff.endDate && (
                        <div>
                          <p className="text-sm text-gray-500">Through</p>
                          <p className="text-lg font-medium text-gray-900">
                            {new Date(signage.workforceStuff.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {(signage.workforceStuff.startTime || signage.workforceStuff.endTime) && (
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="text-lg font-medium text-gray-900">
                            {signage.workforceStuff.startTime && signage.workforceStuff.endTime
                              ? `${signage.workforceStuff.startTime} - ${signage.workforceStuff.endTime}`
                              : signage.workforceStuff.startTime || signage.workforceStuff.endTime}
                          </p>
                        </div>
                      )}
                      {signage.workforceStuff.location && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-lg font-medium text-gray-900">{signage.workforceStuff.location}</p>
                        </div>
                      )}
                    </div>
                    {signage.workforceStuff.description && (
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                          {signage.workforceStuff.description}
                        </p>
                      </div>
                    )}
                    {signage.workforceStuff.eventItems?.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Highlights</h3>
                        <ul className="list-disc list-inside space-y-2">
                          {signage.workforceStuff.eventItems.map((item, index) => (
                            <li key={index} className="text-gray-700">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {signage.workforceStuff.registrationLink && (
                      <div>
                        <a 
                          href={signage.workforceStuff.registrationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                          Register Now →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      <p>Created {new Date(signage.createdAt).toLocaleDateString()}</p>
                      {signage.companyUnit && <p>Unit: {signage.companyUnit}</p>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={handleAssignToDesignPackage}
                        disabled={assigning}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4 mr-2" />
                            Assign to Design Package
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleArchive}
                        disabled={archiving}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {archiving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Archiving...
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  {assignError && (
                    <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                      {assignError}
                    </div>
                  )}
                  {archiveError && (
                    <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                      {archiveError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DigitalSignageViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DigitalSignageViewContent />
    </Suspense>
  )
}




