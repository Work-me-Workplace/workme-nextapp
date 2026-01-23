'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { getIdToken } from '@/lib/firebase/getIdToken'
import api from '@/lib/api'
import { getWorkMe } from '@/lib/workme.client'

// Helper function to format type names for display
function formatTypeName(type: string | null | undefined): string {
  if (!type) return 'unknown'
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function AddWorkforceStuffPage() {
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'review' | 'success'>('input')
  const [selectedType, setSelectedType] = useState<string>('')
  const [parsedData, setParsedData] = useState<any>(null)
  const [trainingId, setTrainingId] = useState<string | null>(null)
  const [impactEventId, setImpactEventId] = useState<string | null>(null)
  const [createdRedirectTo, setCreatedRedirectTo] = useState<string | null>(null)
  const [result, setResult] = useState<{
    type: string
    confidence: number
    explanation: string
    redirectTo: string
  } | null>(null)

  async function handleContinue() {
    if (!rawText.trim()) {
      setError('Please paste some content first')
      return
    }

    if (!selectedType) {
      setError('Please select a content type first')
      return
    }

    // Skip confirmation, go straight to ingest/parse
    await handleConfirmAndSave()
  }

  async function resolveCompanyId(): Promise<string | null> {
    if (typeof window === 'undefined') return null

    const directCompanyId = localStorage.getItem('companyId')
    const storedWorkMe = getWorkMe()
    const workMeCompanyId = storedWorkMe?.companyId
    const legacyCompanyUnit = localStorage.getItem('companyUnit')
    const companyIdValue = directCompanyId || workMeCompanyId || legacyCompanyUnit

    if (companyIdValue) {
      if (!directCompanyId) {
        localStorage.setItem('companyId', companyIdValue)
      }
      return companyIdValue
    }

    try {
      const response = await api.get('/api/workme/me')
      if (response.data.success && response.data.workMe?.companyId) {
        const id = response.data.workMe.companyId
        localStorage.setItem('companyId', id)
        localStorage.setItem('companyUnit', id)
        return id
      }
    } catch (err) {
      console.error('Failed to load companyId:', err)
    }

    return null
  }

  async function handleConfirmAndSave() {
    if (!selectedType) {
      setError('Please select a type')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const companyId = await resolveCompanyId()
      if (!companyId) {
        setError('No companyId found. Please set your company first.')
        setLoading(false)
        return
      }

      // Step 2: Create ingest snapshot only (no parsing, no save)
      const res = await api.post(`/api/workstuff/ingest/${selectedType}/create`, {
        selectedType,
        rawText: rawText.trim(),
        companyId,
      })

      const data = res.data

      if (!data.success) {
        setError(data.error || 'Failed to create ingest record')
        return
      }

      const idFieldMap: Record<string, string> = {
        training: 'trainingId',
        career: 'careerId',
        event: 'eventId',
        campaign: 'campaignId',
        impact_event: 'impactEventId',
        community: 'communityId',
        benefits: 'benefitsId',
        employee_cause: 'employeeCauseId',
      }

      const idField = idFieldMap[selectedType]
      const created = idField ? data[idField] : data.id
      if (!created || typeof created !== 'string') {
        setError('Server response missing created id')
        return
      }

      if (selectedType === 'training') {
        setTrainingId(created)
      }
      if (selectedType === 'impact_event') {
        setImpactEventId(created)
      }
      if (data.redirectTo) {
        setCreatedRedirectTo(data.redirectTo)
      }

      if (selectedType === 'training') {
        const hydrateRes = await api.post('/api/workstuff/ingest/training-hydrate', {
          trainingId: created,
        })

        if (hydrateRes.data.success && hydrateRes.data.model) {
          setParsedData(hydrateRes.data.model)
        } else {
          setError(hydrateRes.data.error || 'Failed to parse training fields')
          return
        }
      } else if (selectedType === 'impact_event') {
        const hydrateRes = await api.post('/api/workstuff/ingest/impact-event-hydrate', {
          impactEventId: created,
        })

        if (hydrateRes.data.success && hydrateRes.data.model) {
          setParsedData(hydrateRes.data.model)
        } else {
          setError(hydrateRes.data.error || 'Failed to parse impact event fields')
          return
        }
      }

      setStep('review')
    } catch (err: any) {
      console.error('Create ingest error:', err)
      setError(err.message || 'Failed to create ingest record')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalizeTraining() {
    if (!trainingId || !parsedData) {
      setError('Missing training data to save')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/api/workstuff/ingest/training-save', {
        trainingId,
        ...parsedData,
      })

      const data = res.data
      if (!data.success) {
        setError(data.error || 'Failed to save training')
        return
      }

      setResult({
        type: selectedType,
        confidence: 0,
        explanation: '',
        redirectTo: `/mycompany/workforcestuff/training/${trainingId}`,
      })
      setStep('success')

      setTimeout(() => {
        router.push(`/mycompany/workforcestuff/training/${trainingId}`)
      }, 2000)
    } catch (err: any) {
      console.error('Training save error:', err)
      setError(err.message || 'Failed to save training')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalizeImpactEvent() {
    if (!impactEventId || !parsedData) {
      setError('Missing impact event data to save')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/api/workstuff/ingest/impact-event-save', {
        impactEventId,
        ...parsedData,
      })

      const data = res.data
      if (!data.success) {
        setError(data.error || 'Failed to save impact event')
        return
      }

      setResult({
        type: selectedType,
        confidence: 0,
        explanation: '',
        redirectTo: `/mycompany/workforcestuff/impact-event/${impactEventId}`,
      })
      setStep('success')

      setTimeout(() => {
        router.push(`/mycompany/workforcestuff/impact-event/${impactEventId}`)
      }, 2000)
    } catch (err: any) {
      console.error('Impact Event save error:', err)
      setError(err.message || 'Failed to save impact event')
    } finally {
      setLoading(false)
    }
  }

  const reviewContent = useMemo(() => {
    if (selectedType === 'impact_event') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={parsedData?.title || ''}
              onChange={(e) => setParsedData({ ...parsedData, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={parsedData?.description || ''}
              onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <textarea
              value={parsedData?.summary || ''}
              onChange={(e) => setParsedData({ ...parsedData, summary: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md h-32"
              placeholder="Comprehensive summary with all critical details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
              <input
                type="date"
                value={parsedData?.effectiveDate || ''}
                onChange={(e) => setParsedData({ ...parsedData, effectiveDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
              <input
                type="text"
                value={parsedData?.urgency || ''}
                onChange={(e) => setParsedData({ ...parsedData, urgency: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., High, Medium, Low"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={parsedData?.location || ''}
              onChange={(e) => setParsedData({ ...parsedData, location: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Impacted Population</label>
            <input
              type="text"
              value={parsedData?.impactedPopulation || ''}
              onChange={(e) => setParsedData({ ...parsedData, impactedPopulation: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Who is affected by this event?"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Point of Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={parsedData?.pocFirstName || ''}
                  onChange={(e) => setParsedData({ ...parsedData, pocFirstName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={parsedData?.pocLastName || ''}
                  onChange={(e) => setParsedData({ ...parsedData, pocLastName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={parsedData?.pocEmail || ''}
                  onChange={(e) => setParsedData({ ...parsedData, pocEmail: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={parsedData?.pocPhone || ''}
                  onChange={(e) => setParsedData({ ...parsedData, pocPhone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (selectedType !== 'training') {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-gray-700">
            Review UI for {formatTypeName(selectedType)} coming soon. For now, your item is created in pending state.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            We created the ingest snapshot but did not save parsed fields yet.
          </p>
          {createdRedirectTo && (
            <button
              onClick={() => router.push(createdRedirectTo)}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View Draft →
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={parsedData?.title || ''}
            onChange={(e) => setParsedData({ ...parsedData, title: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={parsedData?.description || ''}
            onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md h-32"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
            <input
              type="text"
              value={parsedData?.topic || ''}
              onChange={(e) => setParsedData({ ...parsedData, topic: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!parsedData?.mandatory}
                onChange={(e) => setParsedData({ ...parsedData, mandatory: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Mandatory</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sponsoring Office</label>
          <input
            type="text"
            value={parsedData?.sponsoringOffice || ''}
            onChange={(e) => setParsedData({ ...parsedData, sponsoringOffice: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Training Date</label>
            <input
              type="date"
              value={parsedData?.trainingDate || ''}
              onChange={(e) => setParsedData({ ...parsedData, trainingDate: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
              type="time"
              value={parsedData?.startTime || ''}
              onChange={(e) => setParsedData({ ...parsedData, startTime: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
            <input
              type="time"
              value={parsedData?.endTime || ''}
              onChange={(e) => setParsedData({ ...parsedData, endTime: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={parsedData?.location || ''}
            onChange={(e) => setParsedData({ ...parsedData, location: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
          <select
            value={parsedData?.format || ''}
            onChange={(e) => setParsedData({ ...parsedData, format: e.target.value || null })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select format</option>
            <option value="in-person">In-Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
          <input
            type="url"
            value={parsedData?.link || ''}
            onChange={(e) => setParsedData({ ...parsedData, link: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Point of Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rank/Title</label>
              <input
                type="text"
                value={parsedData?.poc?.rankOrTitle || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    poc: { ...(parsedData?.poc || {}), rankOrTitle: e.target.value },
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={parsedData?.poc?.name || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    poc: { ...(parsedData?.poc || {}), name: e.target.value },
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={parsedData?.poc?.email || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    poc: { ...(parsedData?.poc || {}), email: e.target.value },
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={parsedData?.poc?.phone || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    poc: { ...(parsedData?.poc || {}), phone: e.target.value },
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }, [parsedData, selectedType, createdRedirectTo, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/mycompany/workforcestuff"
            className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
          >
            ← Back to Workforce Stuff
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Add Workforce Item</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Select the content type and paste your content to create a workforce item
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 'input' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6"
                >
                  <option value="">Select a type...</option>
                  <option value="training">Training</option>
                  <option value="career">Career Opportunity</option>
                  <option value="event">Event</option>
                  <option value="campaign">Campaign</option>
                  <option value="impact_event">Impact Event</option>
                  <option value="community">Community Engagement</option>
                  <option value="benefits">Benefits</option>
                  <option value="employee_cause">Employee Cause</option>
                  <option value="leader_engagement">Leader Engagement</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Content
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste any workforce communication content here... events, training announcements, benefits info, campaigns, etc."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleContinue}
                  disabled={!rawText.trim() || !selectedType || loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                    </>
                  )}
                </button>
                <Link
                  href="/mycompany/workforcestuff"
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </Link>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Review Fields</h2>
                <p className="text-sm text-gray-600">
                  Confirm each field before saving. Nothing is finalized until you save.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="mb-6">{reviewContent}</div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep('input')
                    setError(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                {selectedType === 'training' && (
                  <button
                    onClick={handleFinalizeTraining}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Training
                      </>
                    )}
                  </button>
                )}
                {selectedType === 'impact_event' && (
                  <button
                    onClick={handleFinalizeImpactEvent}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Impact Event
                      </>
                    )}
                  </button>
                )}
                {selectedType !== 'training' && selectedType !== 'impact_event' && (
                  <button
                    disabled
                    className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed"
                  >
                    Save {formatTypeName(selectedType)} (Coming Soon)
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'success' && result && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Added Successfully!</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Type: {formatTypeName(result.type)}
                </p>
              </div>
              <p className="text-gray-600 mb-4">Redirecting you to the item...</p>
              <Link
                href={result.redirectTo}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                View Item →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select the content type from the dropdown</li>
            <li>• Paste your workforce communication content</li>
            <li>• The parser extracts and structures all relevant information</li>
            <li>• Item is created and ready to use</li>
          </ul>
        </div>
      </div>
    </div>
  )
}




