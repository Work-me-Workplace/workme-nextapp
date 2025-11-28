'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'

interface TrainingModel {
  title: string
  description: string
  startDate: string | null
  endDate: string | null
  poc: {
    name: string | null
    email: string | null
    phone: string | null
  }
  links: string[]
  metadata: {
    location?: string | null
    format?: string | null
    duration?: string | null
    cost?: string | null
    prerequisites?: string | null
  }
}

interface Section {
  id: string
  rawText: string
  heading: string
  type: string
  status: string
}

export default function TrainingModelPage() {
  const router = useRouter()
  const params = useParams()
  const sectionId = params.sectionId as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [section, setSection] = useState<Section | null>(null)
  const [model, setModel] = useState<TrainingModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<TrainingModel>({
    title: '',
    description: '',
    startDate: null,
    endDate: null,
    poc: { name: null, email: null, phone: null },
    links: [],
    metadata: {},
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadSectionAndModel(id)
      }
    }
  }, [router, sectionId])

  async function loadSectionAndModel(id: string) {
    try {
      setLoading(true)
      const { default: api } = await import('@/lib/api')
      
      // Get section
      const sectionsResponse = await api.get('/api/workstuff/map')
      if (sectionsResponse.data.success) {
        const foundSection = sectionsResponse.data.sections.find((s: Section) => s.id === sectionId)
        if (!foundSection) {
          alert('Section not found')
          router.push('/mycompany/workforcestuff/mapper')
          return
        }
        setSection(foundSection)

        // Check if it's training
        if (foundSection.type !== 'training') {
          // Non-training - show coming soon message
          return
        }

        // Get or hydrate model
        const hydrateResponse = await api.post('/api/workstuff/hydrate', { sectionId })
        if (hydrateResponse.data.success) {
          if (hydrateResponse.data.model) {
            setModel(hydrateResponse.data.model)
            setFormData(hydrateResponse.data.model)
          } else if (hydrateResponse.data.message) {
            // Non-training type - show coming soon
            alert(hydrateResponse.data.message)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load:', error)
      alert('Failed to load section')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!workMeId || !section || !formData.title) {
      alert('Please fill in at least the title')
      return
    }

    setSaving(true)
    try {
      const { default: api } = await import('@/lib/api')
      
      // Get companyId from auth
      const response = await api.post('/api/workstuff/save-training', {
        sectionId,
        training: formData,
      })

      if (response.data.success) {
        alert('Training saved successfully!')
        router.push(`/mycompany/workforcestuff/${response.data.training.id}`)
      } else {
        alert('Failed to save: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save training')
    } finally {
      setSaving(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Section Not Found</h2>
            <Link
              href="/mycompany/workforcestuff/mapper"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Mapper
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Non-training types show coming soon
  if (section.type !== 'training') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Model Coming Soon</h2>
              <p className="text-gray-600">
                The model builder for <span className="font-semibold capitalize">{section.type.replace('_', ' ')}</span> is coming soon.
              </p>
              <p className="text-sm text-gray-500 mt-2">Your mapping has been saved.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Original Section:</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                {section.rawText}
              </pre>
            </div>
            <Link
              href="/mycompany/workforcestuff/mapper"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Mapper
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff/mapper" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Mapper
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Training Model Builder</h1>
          <p className="text-gray-600 mt-2">Review and edit the training details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Pane: Raw Section Text */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Original Section</h2>
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                {section.heading}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {section.rawText}
              </pre>
            </div>
          </div>

          {/* Right Pane: Training Model Fields */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Training Details</h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Training title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Training description"
                />
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* POC */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Point of Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.poc.name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          poc: { ...formData.poc, name: e.target.value || null },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="POC name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.poc.email || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          poc: { ...formData.poc, email: e.target.value || null },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="POC email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.poc.phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          poc: { ...formData.poc, phone: e.target.value || null },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="POC phone"
                    />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Links</label>
                <textarea
                  value={formData.links.join('\n')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      links: e.target.value.split('\n').filter((l) => l.trim()),
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="One link per line"
                />
              </div>

              {/* Metadata */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Additional Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.metadata.location || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, location: e.target.value || null },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Training location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select
                      value={formData.metadata.format || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, format: e.target.value || null },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select format</option>
                      <option value="in-person">In-Person</option>
                      <option value="virtual">Virtual</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={formData.metadata.duration || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metadata: { ...formData.metadata, duration: e.target.value || null },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 2 hours, 1 day"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t flex gap-4">
              <button
                onClick={() => router.push('/mycompany/workforcestuff/mapper')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Training
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

