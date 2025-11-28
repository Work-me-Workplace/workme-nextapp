'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { CheckCircle, ArrowRight, Loader2, ChevronRight } from 'lucide-react'

interface Section {
  id: string
  rawText: string
  heading: string
  inferredType: string
  type?: string
  status: 'pending' | 'mapped'
  modelStatus?: 'pending' | 'hydrated' | 'coming_soon'
}

const COMPANY_X_TYPES = [
  { value: 'training', label: 'Training' },
  { value: 'event', label: 'Event' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'impact_event', label: 'Impact Event' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'community', label: 'Community' },
  { value: 'career', label: 'Career' },
  { value: 'employee_cause', label: 'Employee Cause' },
]

export default function WorkforceMapperPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [selectedTypes, setSelectedTypes] = useState<Record<string, string>>({})

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
      const response = await api.get('/api/workstuff/map')
      if (response.data.success) {
        const loadedSections = response.data.sections || []
        
        // If no sections found, create fallback section from last pasted blob
        // ALWAYS infer type - never use placeholder
        if (loadedSections.length === 0) {
          const rawBlobResponse = await api.get('/api/workstuff/raw-blob')
          if (rawBlobResponse.data.success && rawBlobResponse.data.blob) {
            // Infer type for fallback section - ALWAYS run inference
            const { inferCompanyXType } = await import('@/lib/services/companyx-topic-inference')
            const inference = await inferCompanyXType(rawBlobResponse.data.blob)
            
            const fallbackSection: Section = {
              id: `fallback_${Date.now()}`,
              rawText: rawBlobResponse.data.blob,
              heading: '', // Empty heading - UI will show "Section 1"
              inferredType: inference.type, // ALWAYS infer, never placeholder
              status: 'pending',
            }
            setSections([fallbackSection])
            setSelectedTypes({ [fallbackSection.id]: inference.type })
            
            // Store fallback section in Redis
            await api.post('/api/workstuff/map', {
              sectionId: fallbackSection.id,
              type: inference.type,
            })
          } else {
            // No blob either - redirect to ingest
            router.push('/mycompany/workforcestuff/ingest')
            return
          }
        } else {
          setSections(loadedSections)
          // Initialize selected types from sections
          const types: Record<string, string> = {}
          loadedSections.forEach((s: Section) => {
            types[s.id] = s.type || s.inferredType
          })
          setSelectedTypes(types)
        }
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
        // On error, try to create fallback - ALWAYS infer type
        try {
          const { default: api } = await import('@/lib/api')
          const rawBlobResponse = await api.get('/api/workstuff/raw-blob')
          if (rawBlobResponse.data.success && rawBlobResponse.data.blob) {
            // ALWAYS infer type - never use placeholder
            const { inferCompanyXType } = await import('@/lib/services/companyx-topic-inference')
            const inference = await inferCompanyXType(rawBlobResponse.data.blob)
            
            const fallbackSection: Section = {
              id: `fallback_${Date.now()}`,
              rawText: rawBlobResponse.data.blob,
              heading: '', // Empty heading - UI will show "Section 1"
              inferredType: inference.type, // ALWAYS infer
              status: 'pending',
            }
            setSections([fallbackSection])
            setSelectedTypes({ [fallbackSection.id]: inference.type })
          } else {
            router.push('/mycompany/workforcestuff/ingest')
          }
        } catch (fallbackError) {
          router.push('/mycompany/workforcestuff/ingest')
        }
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmMapping(sectionId: string) {
    if (!workMeId) return

    const selectedType = selectedTypes[sectionId]
    if (!selectedType) return

    setLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workstuff/map', {
        sectionId,
        type: selectedType,
      })

      if (response.data.success) {
        // Update local state
        const updatedSections = sections.map((s: Section) =>
          s.id === sectionId
            ? {
                ...s,
                type: selectedType,
                status: 'mapped' as const,
                modelStatus: (selectedType === 'training' ? 'pending' : 'coming_soon') as 'pending' | 'coming_soon',
              }
            : s
        )
        setSections(updatedSections)

        // Move to next section or show completion
        if (currentSectionIndex < sections.length - 1) {
          setCurrentSectionIndex(currentSectionIndex + 1)
        } else {
          // All mapped - check if any are training
          const trainingSections = updatedSections.filter((s) => s.type === 'training')
          if (trainingSections.length > 0) {
            // Navigate to model builder for first training section
            router.push(`/mycompany/workforcestuff/mapper/${trainingSections[0].id}`)
          } else {
            alert('All sections mapped! Non-training types are marked as "coming soon".')
          }
        }
      } else {
        alert('Failed to confirm mapping: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Mapping error:', error)
      alert('Failed to confirm mapping')
    } finally {
      setLoading(false)
    }
  }

  const currentSection = sections[currentSectionIndex]

  if (!workMeId || loading && sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // No empty state - loadSections will create fallback or redirect

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Section Mapper</h1>
          <p className="text-gray-600 mt-2">
            Map each section to a CompanyX type ({currentSectionIndex + 1} of {sections.length})
          </p>
        </div>

        {currentSection && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Pane: Raw Section Text */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Section Text</h2>
              <div className="mb-4">
                {currentSection.heading ? (
                  <span className="text-xs font-medium text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                    {currentSection.heading}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">
                    Section {currentSectionIndex + 1}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {currentSection.rawText}
                </pre>
              </div>
            </div>

            {/* Right Pane: Type Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Map to CompanyX Type</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inferred Type:
                </label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-900 capitalize">
                    {currentSection.inferredType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Type (override if needed):
                </label>
                <select
                  value={selectedTypes[currentSection.id] || currentSection.inferredType}
                  onChange={(e) => {
                    setSelectedTypes({
                      ...selectedTypes,
                      [currentSection.id]: e.target.value,
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {COMPANY_X_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleConfirmMapping(currentSection.id)}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    Confirm Mapping
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {currentSection.status === 'mapped' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-900">Mapped</span>
                  </div>
                  {currentSection.type === 'training' ? (
                    <p className="text-xs text-green-700 mt-2">
                      Ready for hydration → Model builder
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 mt-2">
                      Coming soon — mapping saved
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Progress</h3>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  index === currentSectionIndex
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : section.status === 'mapped'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {section.status === 'mapped' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {section.heading || `Section ${index + 1}`}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {section.type || section.inferredType} {section.modelStatus && `• ${section.modelStatus}`}
                  </div>
                </div>
                {index === currentSectionIndex && (
                  <ChevronRight className="h-5 w-5 text-blue-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
