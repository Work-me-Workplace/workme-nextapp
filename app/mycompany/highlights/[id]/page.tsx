'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Award, ArrowLeft, Save, Edit2 } from 'lucide-react'
import api from '@/lib/api'

interface Highlight {
  id: string
  fullName: string
  title?: string | null
  unit?: string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  citationText: string
  achievement?: string | null
  narrative?: string | null
  classification?: string | null
  photoUrl?: string | null
  supervisorQuote?: string | null
  createdAt: string
  updatedAt: string
}

export default function HighlightDetailPage() {
  const router = useRouter()
  const params = useParams()
  const highlightId = params?.id as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<Highlight | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    unit: '',
    awardName: '',
    awardingAgency: '',
    awardYear: '',
    achievement: '',
    narrative: '',
    classification: '',
    photoUrl: '',
    supervisorQuote: '',
    citationText: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadHighlight()
      }
    }
  }, [router, highlightId])

  async function loadHighlight() {
    try {
      setLoading(true)
      const response = await api.get(`/api/company/highlights/${highlightId}`)
      
      if (response.data.success && response.data.highlight) {
        const h = response.data.highlight
        setHighlight(h)
        setFormData({
          fullName: h.fullName || '',
          title: h.title || '',
          unit: h.unit || '',
          awardName: h.awardName || '',
          awardingAgency: h.awardingAgency || '',
          awardYear: h.awardYear?.toString() || '',
          achievement: h.achievement || '',
          narrative: h.narrative || '',
          classification: h.classification || '',
          photoUrl: h.photoUrl || '',
          supervisorQuote: h.supervisorQuote || '',
          citationText: h.citationText || '',
        })
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

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const updateData: any = {
        fullName: formData.fullName,
        title: formData.title || null,
        unit: formData.unit || null,
        awardName: formData.awardName || null,
        awardingAgency: formData.awardingAgency || null,
        awardYear: formData.awardYear ? parseInt(formData.awardYear) : null,
        achievement: formData.achievement || null,
        narrative: formData.narrative || null,
        classification: formData.classification || null,
        photoUrl: formData.photoUrl || null,
        supervisorQuote: formData.supervisorQuote || null,
        citationText: formData.citationText,
      }

      const response = await api.put(`/api/company/highlights/${highlightId}`, updateData)

      if (response.data.success) {
        setIsEditing(false)
        await loadHighlight()
      } else {
        setError(response.data.error || 'Failed to update highlight')
      }
    } catch (err: any) {
      console.error('Failed to update highlight:', err)
      setError(err.response?.data?.error || err.message || 'Failed to update highlight')
    } finally {
      setSaving(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!highlight) {
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
              <Link href="/mycompany/highlights" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
                ← Back to Highlights
              </Link>
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">{error || 'Highlight not found'}</p>
                <Link href="/mycompany/highlights" className="text-blue-600 hover:text-blue-700">
                  ← Back to Highlights
                </Link>
              </div>
            </div>
          </main>
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
              href="/mycompany/highlights"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Highlights
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Award className="h-6 w-6 text-blue-600 mr-2" />
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isEditing ? 'Edit Highlight' : highlight.fullName}
                  </h1>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    <Edit2 className="h-5 w-5 mr-2" />
                    Edit
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {isEditing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title / Role
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Engineer, TWH, Analyst"
                      />
                    </div>

                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <input
                        type="text"
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., NAVSEA 05, SEA 08"
                      />
                    </div>

                    <div>
                      <label htmlFor="classification" className="block text-sm font-medium text-gray-700 mb-2">
                        Classification
                      </label>
                      <input
                        type="text"
                        id="classification"
                        value={formData.classification}
                        onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Leadership, Innovation"
                      />
                    </div>

                    <div>
                      <label htmlFor="awardName" className="block text-sm font-medium text-gray-700 mb-2">
                        Award Name
                      </label>
                      <input
                        type="text"
                        id="awardName"
                        value={formData.awardName}
                        onChange={(e) => setFormData({ ...formData, awardName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="awardingAgency" className="block text-sm font-medium text-gray-700 mb-2">
                        Awarding Agency
                      </label>
                      <input
                        type="text"
                        id="awardingAgency"
                        value={formData.awardingAgency}
                        onChange={(e) => setFormData({ ...formData, awardingAgency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="awardYear" className="block text-sm font-medium text-gray-700 mb-2">
                        Award Year
                      </label>
                      <input
                        type="number"
                        id="awardYear"
                        value={formData.awardYear}
                        onChange={(e) => setFormData({ ...formData, awardYear: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 2024"
                      />
                    </div>

                    <div>
                      <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        Photo URL
                      </label>
                      <input
                        type="url"
                        id="photoUrl"
                        value={formData.photoUrl}
                        onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="achievement" className="block text-sm font-medium text-gray-700 mb-2">
                      Achievement Summary
                    </label>
                    <textarea
                      id="achievement"
                      rows={3}
                      value={formData.achievement}
                      onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Single-sentence distilled summary"
                    />
                  </div>

                  <div>
                    <label htmlFor="narrative" className="block text-sm font-medium text-gray-700 mb-2">
                      Narrative
                    </label>
                    <textarea
                      id="narrative"
                      rows={4}
                      value={formData.narrative}
                      onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="AI-synthesized story or narrative"
                    />
                  </div>

                  <div>
                    <label htmlFor="supervisorQuote" className="block text-sm font-medium text-gray-700 mb-2">
                      Supervisor Quote
                    </label>
                    <textarea
                      id="supervisorQuote"
                      rows={3}
                      value={formData.supervisorQuote}
                      onChange={(e) => setFormData({ ...formData, supervisorQuote: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="citationText" className="block text-sm font-medium text-gray-700 mb-2">
                      Citation Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="citationText"
                      rows={12}
                      required
                      value={formData.citationText}
                      onChange={(e) => setFormData({ ...formData, citationText: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form data
                        if (highlight) {
                          setFormData({
                            fullName: highlight.fullName || '',
                            title: highlight.title || '',
                            unit: highlight.unit || '',
                            awardName: highlight.awardName || '',
                            awardingAgency: highlight.awardingAgency || '',
                            awardYear: highlight.awardYear?.toString() || '',
                            achievement: highlight.achievement || '',
                            narrative: highlight.narrative || '',
                            classification: highlight.classification || '',
                            photoUrl: highlight.photoUrl || '',
                            supervisorQuote: highlight.supervisorQuote || '',
                            citationText: highlight.citationText || '',
                          })
                        }
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Full Name</h3>
                      <p className="text-gray-900">{highlight.fullName}</p>
                    </div>
                    {highlight.title && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Title</h3>
                        <p className="text-gray-900">{highlight.title}</p>
                      </div>
                    )}
                    {highlight.unit && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Unit</h3>
                        <p className="text-gray-900">{highlight.unit}</p>
                      </div>
                    )}
                    {highlight.classification && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Classification</h3>
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {highlight.classification}
                        </span>
                      </div>
                    )}
                    {highlight.awardName && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Award Name</h3>
                        <p className="text-gray-900">{highlight.awardName}</p>
                      </div>
                    )}
                    {highlight.awardingAgency && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Awarding Agency</h3>
                        <p className="text-gray-900">{highlight.awardingAgency}</p>
                      </div>
                    )}
                    {highlight.awardYear && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Award Year</h3>
                        <p className="text-gray-900">{highlight.awardYear}</p>
                      </div>
                    )}
                  </div>

                  {highlight.photoUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Photo</h3>
                      <img
                        src={highlight.photoUrl}
                        alt={highlight.fullName}
                        className="max-w-xs rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  {highlight.achievement && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Achievement Summary</h3>
                      <p className="text-gray-900">{highlight.achievement}</p>
                    </div>
                  )}

                  {highlight.narrative && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Narrative</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{highlight.narrative}</p>
                    </div>
                  )}

                  {highlight.supervisorQuote && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Supervisor Quote</h3>
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
                        {highlight.supervisorQuote}
                      </blockquote>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Citation Text</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                        {highlight.citationText}
                      </pre>
                    </div>
                  </div>

                  <div className="pt-4 border-t text-sm text-gray-500">
                    <p>Created: {new Date(highlight.createdAt).toLocaleString()}</p>
                    <p>Last updated: {new Date(highlight.updatedAt).toLocaleString()}</p>
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

