'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { createTraining } from '@/lib/actions/companyx-actions'
import { CheckCircle, ArrowRight, Loader2, FileText, Save } from 'lucide-react'

interface Section {
  id: string
  rawText: string
  heading?: string
  type?: string
  status: string
  modelStatus?: string
}

interface TrainingModel {
  title: string
  description: string
  startDate: string | null
  endDate: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  pocName: string | null
  pocEmail: string | null
  pocPhone: string | null
  registrationLink: string | null
  links: string[]
  metadata: any
}

export default function WorkforceStuffModelsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [model, setModel] = useState<TrainingModel | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadSections(id)
      }
    }
  }, [router])

  async function loadSections(id: string) {
    try {
      setLoading(true)
      const { default: api } = await import('@/lib/api')
      const response = await api.get('/api/workforce-stuff/map')
      if (response.data.success) {
        const mappedSections = (response.data.sections || []).filter(
          (s: Section) => s.status === 'mapped'
        )
        setSections(mappedSections)
        if (mappedSections.length > 0) {
          const firstTraining = mappedSections.find((s: Section) => s.type === 'training')
          if (firstTraining) {
            setSelectedSection(firstTraining)
            await loadModel(id, firstTraining.id)
          } else {
            setSelectedSection(mappedSections[0])
          }
        }
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadModel(workMeId: string, sectionId: string) {
    setModelLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workforce-stuff/hydrate', {
        sectionId,
      })

      if (response.data.success && response.data.model) {
        setModel(response.data.model.companyX)
      } else if (response.data.modelStatus === 'coming_soon') {
        // Non-training type
        setModel(null)
      }
    } catch (error) {
      console.error('Failed to load model:', error)
    } finally {
      setModelLoading(false)
    }
  }

  async function handleSectionSelect(section: Section) {
    setSelectedSection(section)
    if (section.type === 'training' && workMeId) {
      await loadModel(workMeId, section.id)
    } else {
      setModel(null)
    }
  }

  async function handleSave() {
    if (!model || !workMeId || !selectedSection) return

    setSaving(true)
    try {
      // Parse dates
      const trainingDate =
        model.startDate && model.startTime
          ? new Date(`${model.startDate}T${model.startTime}`)
          : model.startDate
          ? new Date(model.startDate + 'T00:00:00')
          : null

      const deadline =
        model.endDate && model.endTime
          ? new Date(`${model.endDate}T${model.endTime}`)
          : model.endDate
          ? new Date(model.endDate + 'T23:59:59')
          : null

      // Split POC name
      const pocNameParts = (model.pocName || '').split(' ')
      const pocFirstName = pocNameParts[0] || null
      const pocLastName = pocNameParts.slice(1).join(' ') || null

      const result = await createTraining({
        title: model.title,
        description: model.description || null,
        trainingDate,
        deadline,
        link: model.registrationLink || model.links[0] || null,
        mandatory: false,
        sponsoringOffice: model.metadata?.sponsoringOffice || null,
        pocFirstName,
        pocLastName,
        pocEmail: model.pocEmail || null,
        pocPhone: model.pocPhone || null,
      })

      if (result.success && result.training) {
        alert('Training saved successfully!')
        // Remove section from list
        const updatedSections = sections.filter((s) => s.id !== selectedSection.id)
        setSections(updatedSections)
        if (updatedSections.length > 0) {
          const nextTraining = updatedSections.find((s) => s.type === 'training')
          if (nextTraining) {
            setSelectedSection(nextTraining)
            await loadModel(workMeId, nextTraining.id)
          } else {
            setSelectedSection(updatedSections[0])
            setModel(null)
          }
        } else {
          router.push('/mycompany/workforcestuff')
        }
      } else {
        alert('Failed to save training: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save training')
    } finally {
      setSaving(false)
    }
  }

  function updateModelField(field: keyof TrainingModel, value: any) {
    if (!model) return
    setModel({ ...model, [field]: value })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Mapped Sections</h2>
            <p className="text-gray-600 mb-4">Please map your sections first.</p>
            <Link
              href="/mycompany/workforcestuff/mapper"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Mapper
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const trainingSections = sections.filter((s) => s.type === 'training')
  const otherSections = sections.filter((s) => s.type !== 'training')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Model Builder</h1>
          <p className="text-gray-600 mt-2">
            Review and edit training models, then save to Prisma
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Pane: Raw Section Text */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Raw Section Text</h2>
              {selectedSection && (
                <span className="text-xs text-gray-500">
                  Section {sections.findIndex((s) => s.id === selectedSection.id) + 1} of {sections.length}
                </span>
              )}
            </div>
            {selectedSection && (
              <>
                {selectedSection.heading && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-900">{selectedSection.heading}</p>
                  </div>
                )}
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {selectedSection.rawText}
                  </pre>
                </div>
              </>
            )}
          </div>

          {/* Right Pane: Model Fields */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Model</h2>
            {selectedSection && selectedSection.type === 'training' && (
              <>
                {modelLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading model...</span>
                  </div>
                ) : model ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={model.title}
                        onChange={(e) => updateModelField('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={model.description}
                        onChange={(e) => updateModelField('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={model.startDate || ''}
                          onChange={(e) => updateModelField('startDate', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={model.startTime || ''}
                          onChange={(e) => updateModelField('startTime', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={model.endDate || ''}
                          onChange={(e) => updateModelField('endDate', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={model.endTime || ''}
                          onChange={(e) => updateModelField('endTime', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={model.location || ''}
                        onChange={(e) => updateModelField('location', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Point of Contact</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            POC Name
                          </label>
                          <input
                            type="text"
                            value={model.pocName || ''}
                            onChange={(e) => updateModelField('pocName', e.target.value || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              POC Email
                            </label>
                            <input
                              type="email"
                              value={model.pocEmail || ''}
                              onChange={(e) => updateModelField('pocEmail', e.target.value || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              POC Phone
                            </label>
                            <input
                              type="tel"
                              value={model.pocPhone || ''}
                              onChange={(e) => updateModelField('pocPhone', e.target.value || null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Link
                      </label>
                      <input
                        type="url"
                        value={model.registrationLink || ''}
                        onChange={(e) => updateModelField('registrationLink', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleSave}
                        disabled={saving || !model.title}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save to Prisma
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Model not hydrated yet. Click "Hydrate" to generate.
                    </p>
                  </div>
                )}
              </>
            )}

            {selectedSection && selectedSection.type !== 'training' && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-gray-600 mb-2">Model coming soon for this type</p>
                <p className="text-sm text-gray-500">
                  Mapping saved. Full model builder will be available soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section List */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Training Sections ({trainingSections.length})
          </h3>
          {trainingSections.length > 0 ? (
            <div className="space-y-2">
              {trainingSections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionSelect(section)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedSection?.id === section.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {section.heading || section.rawText.substring(0, 50) + '...'}
                      </span>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      Training
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No training sections to process</p>
          )}

          {otherSections.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
                Other Sections ({otherSections.length})
              </h3>
              <div className="space-y-2">
                {otherSections.map((section, index) => (
                  <div
                    key={section.id}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {section.heading || section.rawText.substring(0, 50) + '...'}
                        </span>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

