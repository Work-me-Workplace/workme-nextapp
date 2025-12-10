'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { DigitalSignType } from '@prisma/client'

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
    employee: {
      id: string
      fullName: string
      title?: string | null
    }
  }>
  units: Array<{
    companyUnit: string
  }>
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

  // Form state - Workforce Achievement
  const [personName, setPersonName] = useState('')
  const [unit, setUnit] = useState('')
  const [achievement, setAchievement] = useState('')
  const [details, setDetails] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

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
        if (highlightId) {
          loadHighlight()
        }
      }
    }
  }, [router, highlightId])

  useEffect(() => {
    if (highlight && signType === 'WORKFORCE_ACHIEVEMENT') {
      const employee = highlight.employees[0]?.employee
      if (employee) {
        setPersonName(employee.fullName || '')
        setUnit(highlight.units[0]?.companyUnit || '')
        setAchievement(highlight.achievement || highlight.citationText || '')
        setDetails(highlight.citationText || '')
        setPhotoUrl(highlight.photoUrl || '')
      }
    }
  }, [highlight, signType])

  async function loadHighlight() {
    if (!highlightId) return

    try {
      setLoading(true)
      const response = await api.get(`/api/company/highlights/${highlightId}`)
      
      if (response.data.success && response.data.highlight) {
        setHighlight(response.data.highlight)
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
      if (!personName || !achievement) {
        setError('Person name and achievement are required')
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
        payload.workforceAchievement = {
          personName,
          unit: unit || null,
          achievement,
          details: details || null,
          photoUrl: photoUrl || null,
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

      const response = await api.post('/api/digital-signage/create', payload)

      if (response.data.success) {
        router.push(`/mywork/digital-signage/${response.data.signage.id}`)
      } else {
        setError(response.data.error || 'Failed to create digital signage')
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

            {source === 'ai' ? (
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
                {signType === 'WORKFORCE_ACHIEVEMENT' && (
                  <div className="space-y-6">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Photo URL</label>
                      <input
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>
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

                <div className="mt-8 flex space-x-4">
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Digital Signage'}
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
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
