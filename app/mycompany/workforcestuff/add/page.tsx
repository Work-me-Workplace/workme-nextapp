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
  const [createdId, setCreatedId] = useState<string | null>(null)
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
      // All types: parse only (no DB write). Everything stays in React state until Save.
      const res = await api.post(`/api/workstuff/ingest/${selectedType}/parse`, {
        rawText: rawText.trim(),
      })
      const data = res.data
      if (!data.success) {
        setError(data.error || data.parseError || 'Failed to parse content')
        return
      }
      if (data.model) {
        setParsedData(data.model)
      } else {
        setError('No parsed data returned')
        return
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
    if (!parsedData) {
      setError('Missing training data to save')
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

      const res = await api.post('/api/workstuff/ingest/training-create', {
        companyId,
        ingestRawText: rawText.trim() || null,
        ...parsedData,
      })

      const data = res.data
      if (!data.success) {
        setError(data.error || 'Failed to save training')
        return
      }

      const newTrainingId = data.trainingId
      setResult({
        type: selectedType,
        confidence: 0,
        explanation: '',
        redirectTo: `/mycompany/workforcestuff/training/${newTrainingId}`,
      })
      setStep('success')

      setTimeout(() => {
        router.push(`/mycompany/workforcestuff/training/${newTrainingId}`)
      }, 2000)
    } catch (err: any) {
      console.error('Training save error:', err)
      setError(err.message || 'Failed to save training')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalizeImpactEvent() {
    if (!parsedData) {
      setError('Missing impact event data to save')
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

      const res = await api.post('/api/workstuff/ingest/impact-event-create', {
        companyId,
        ingestRawText: rawText.trim() || null,
        ...parsedData,
      })

      const data = res.data
      if (!data.success) {
        setError(data.error || 'Failed to save impact event')
        return
      }

      const newImpactEventId = data.impactEventId
      setResult({
        type: selectedType,
        confidence: 0,
        explanation: '',
        redirectTo: `/mycompany/workforcestuff/impact-event/${newImpactEventId}`,
      })
      setStep('success')

      setTimeout(() => {
        router.push(`/mycompany/workforcestuff/impact-event/${newImpactEventId}`)
      }, 2000)
    } catch (err: any) {
      console.error('Impact Event save error:', err)
      setError(err.message || 'Failed to save impact event')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalizeOther() {
    if (!parsedData) {
      setError(`Missing ${selectedType} data to save`)
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

      // First create the record
      const createRes = await api.post(`/api/workstuff/ingest/${selectedType}/create`, {
        rawText: rawText.trim(),
        companyId,
      })

      const createData = createRes.data
      if (!createData.success) {
        setError(createData.error || 'Failed to create record')
        return
      }

      const idFieldMap: Record<string, string> = {
        event: 'eventId',
        campaign: 'campaignId',
        community: 'communityId',
        benefits: 'benefitsId',
        employee_cause: 'employeeCauseId',
        leader_engagement: 'leaderEngagementId',
      }

      const idField = idFieldMap[selectedType]
      const createdId = idField ? createData[idField] : createData.id
      if (!createdId || typeof createdId !== 'string') {
        setError('Server response missing created id')
        return
      }

      // Then save the parsed data
      const saveEndpointMap: Record<string, string> = {
        event: '/api/workstuff/ingest/event-save',
        campaign: '/api/workstuff/ingest/campaign-save',
        community: '/api/workstuff/ingest/community-save',
        benefits: '/api/workstuff/ingest/benefits-save',
        employee_cause: '/api/workstuff/ingest/employee-cause-save',
        leader_engagement: '/api/workstuff/ingest/leader-engagement-save',
      }

      const saveEndpoint = saveEndpointMap[selectedType]
      if (!saveEndpoint) {
        setError(`No save endpoint for type: ${selectedType}`)
        return
      }

      const saveRes = await api.post(saveEndpoint, {
        [idField]: createdId,
        ...parsedData,
      })

      const saveData = saveRes.data
      if (!saveData.success) {
        setError(saveData.error || 'Failed to save data')
        return
      }

      const redirectPathMap: Record<string, string> = {
        event: `/mycompany/workforcestuff/event/${createdId}`,
        campaign: `/mycompany/workforcestuff/campaign/${createdId}`,
        community: `/mycompany/workforcestuff/community/${createdId}`,
        benefits: `/mycompany/workforcestuff/benefits/${createdId}`,
        employee_cause: `/mycompany/workforcestuff/employee-cause/${createdId}`,
        leader_engagement: `/mycompany/workforcestuff/leader-engagement/${createdId}`,
      }

      const redirectPath = redirectPathMap[selectedType] || `/mycompany/workforcestuff`
      setResult({
        type: selectedType,
        confidence: 0,
        explanation: '',
        redirectTo: redirectPath,
      })
      setStep('success')

      setTimeout(() => {
        router.push(redirectPath)
      }, 2000)
    } catch (err: any) {
      console.error(`${selectedType} save error:`, err)
      setError(err.message || `Failed to save ${selectedType}`)
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
              placeholder="The impact/deal - what's happening..."
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={parsedData?.location || ''}
                onChange={(e) => setParsedData({ ...parsedData, location: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Who It Affects</label>
              <input
                type="text"
                value={parsedData?.impactedPopulation || ''}
                onChange={(e) => setParsedData({ ...parsedData, impactedPopulation: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., All D.C. area employees, Remote workers, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
              <select
                value={parsedData?.urgency || ''}
                onChange={(e) => setParsedData({ ...parsedData, urgency: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select urgency</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
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

    if (selectedType === 'event') {
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <input
              type="text"
              value={parsedData?.theme || ''}
              onChange={(e) => setParsedData({ ...parsedData, theme: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
              <input
                type="date"
                value={parsedData?.eventDate || ''}
                onChange={(e) => setParsedData({ ...parsedData, eventDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
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
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={parsedData?.eventCategory || ''}
                onChange={(e) => setParsedData({ ...parsedData, eventCategory: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
              <input
                type="text"
                value={parsedData?.audience || ''}
                onChange={(e) => setParsedData({ ...parsedData, audience: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Link</label>
            <input
              type="url"
              value={parsedData?.registrationLink || ''}
              onChange={(e) => setParsedData({ ...parsedData, registrationLink: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Point of Contact</h3>
            <div className="grid grid-cols-2 gap-4">
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

    if (selectedType === 'campaign') {
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Window Start</label>
              <input
                type="date"
                value={parsedData?.windowStart || ''}
                onChange={(e) => setParsedData({ ...parsedData, windowStart: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Window End</label>
              <input
                type="date"
                value={parsedData?.windowEnd || ''}
                onChange={(e) => setParsedData({ ...parsedData, windowEnd: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CTA Link</label>
            <input
              type="url"
              value={parsedData?.ctaLink || ''}
              onChange={(e) => setParsedData({ ...parsedData, ctaLink: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor</label>
            <input
              type="text"
              value={parsedData?.sponsor || ''}
              onChange={(e) => setParsedData({ ...parsedData, sponsor: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
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

    if (selectedType === 'community') {
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Partner Organization</label>
            <input
              type="text"
              value={parsedData?.partnerOrg || ''}
              onChange={(e) => setParsedData({ ...parsedData, partnerOrg: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={parsedData?.date || ''}
                onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
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
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Sign Up Link</label>
            <input
              type="url"
              value={parsedData?.signUpLink || ''}
              onChange={(e) => setParsedData({ ...parsedData, signUpLink: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
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

    if (selectedType === 'benefits') {
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee Benefit Summary</label>
            <textarea
              value={parsedData?.employeeBenefitSummary || ''}
              onChange={(e) => setParsedData({ ...parsedData, employeeBenefitSummary: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Window Start</label>
              <input
                type="date"
                value={parsedData?.windowStart || ''}
                onChange={(e) => setParsedData({ ...parsedData, windowStart: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Window End</label>
              <input
                type="date"
                value={parsedData?.windowEnd || ''}
                onChange={(e) => setParsedData({ ...parsedData, windowEnd: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Link</label>
            <input
              type="url"
              value={parsedData?.actionLink || ''}
              onChange={(e) => setParsedData({ ...parsedData, actionLink: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )
    }

    if (selectedType === 'employee_cause') {
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Impact Summary</label>
            <textarea
              value={parsedData?.impactSummary || ''}
              onChange={(e) => setParsedData({ ...parsedData, impactSummary: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner Organization</label>
              <input
                type="text"
                value={parsedData?.partnerOrg || ''}
                onChange={(e) => setParsedData({ ...parsedData, partnerOrg: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sponsoring Department</label>
              <input
                type="text"
                value={parsedData?.sponsoringDepartment || ''}
                onChange={(e) => setParsedData({ ...parsedData, sponsoringDepartment: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Window Start</label>
              <input
                type="date"
                value={parsedData?.windowStart || ''}
                onChange={(e) => setParsedData({ ...parsedData, windowStart: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Window End</label>
              <input
                type="date"
                value={parsedData?.windowEnd || ''}
                onChange={(e) => setParsedData({ ...parsedData, windowEnd: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
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
        </div>
      )
    }

    if (selectedType === 'leader_engagement') {
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Engagement Date</label>
              <input
                type="date"
                value={parsedData?.engagementDate || ''}
                onChange={(e) => setParsedData({ ...parsedData, engagementDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
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
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leader Name</label>
              <input
                type="text"
                value={parsedData?.leaderName || ''}
                onChange={(e) => setParsedData({ ...parsedData, leaderName: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Leader Title</label>
              <input
                type="text"
                value={parsedData?.leaderTitle || ''}
                onChange={(e) => setParsedData({ ...parsedData, leaderTitle: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Registration Link</label>
            <input
              type="url"
              value={parsedData?.registrationLink || ''}
              onChange={(e) => setParsedData({ ...parsedData, registrationLink: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Point of Contact</h3>
            <div className="grid grid-cols-2 gap-4">
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

        <div className="mb-4">
          <label className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              checked={parsedData?.isSelfPaced || false}
              onChange={(e) => setParsedData({ ...parsedData, isSelfPaced: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Self-paced training</span>
          </label>
          <p className="text-xs text-gray-500 ml-6">Check if training can be completed anytime (no fixed schedule)</p>
        </div>

        {parsedData?.isSelfPaced ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complete By (Deadline)</label>
            <input
              type="date"
              value={parsedData?.completionDeadline || ''}
              onChange={(e) => setParsedData({ ...parsedData, completionDeadline: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Deadline for completing this self-paced training</p>
          </div>
        ) : (
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
        )}

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
                {(selectedType === 'event' || selectedType === 'campaign' || selectedType === 'community' || selectedType === 'benefits' || selectedType === 'employee_cause' || selectedType === 'leader_engagement') && (
                  <button
                    onClick={handleFinalizeOther}
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
                        Save {formatTypeName(selectedType)}
                      </>
                    )}
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




