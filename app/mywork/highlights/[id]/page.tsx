'use client'

import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Award, ArrowLeft, Monitor, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { getClassificationColor, classificationConfig, HighlightClassification } from '@/lib/config/highlightClassification'

interface Employee {
  id: string
  fullName: string
  title?: string | null
  email?: string | null
}

interface Highlight {
  id: string
  citationText: string
  achievement?: string | null
  narrative?: string | null
  classification?: HighlightClassification | string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  supervisorQuote?: string | null
  photoUrl?: string | null
  createdAt: string
  updatedAt: string
  employees: Array<{
    employee: Employee
  }>
  units: Array<{
    companyUnit: string
  }>
}

function HighlightViewContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const highlightId = params?.id as string
  const signType = searchParams?.get('signType')
  const returnPath = searchParams?.get('return') || '/mywork/digital-signage/builder/new'

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<Highlight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  function getClassificationLabel(classification?: HighlightClassification | string | null): string {
    if (!classification) return ''
    if (Object.values(HighlightClassification).includes(classification as HighlightClassification)) {
      return classificationConfig[classification as HighlightClassification]?.label || String(classification)
    }
    return String(classification)
  }

  function handleUseHighlight() {
    // Navigate to digital signage builder with this highlight pre-filled
    const builderUrl = `/mywork/digital-signage/builder/new?type=${signType || 'WORKFORCE_ACHIEVEMENT'}&highlightId=${highlightId}`
    router.push(builderUrl)
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !highlight) {
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error || 'Highlight not found'}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const employee = highlight.employees[0]?.employee
  const employeeName = employee?.fullName || 'Unknown Employee'

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
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
              href={returnPath || '/mycompany/highlights'}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Selection
            </Link>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header - Read-only context */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <Monitor className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium text-purple-100">Selecting for Digital Signage</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{employeeName}</h1>
                    {employee?.title && (
                      <p className="text-purple-100 text-lg">{employee.title}</p>
                    )}
                  </div>
                  <Award className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              {/* Content - Read-only view */}
              <div className="px-8 py-6 space-y-6">
                {/* Award Metadata */}
                {highlight.awardName && (
                  <div className="border-b pb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Award Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Award Name</p>
                        <p className="text-lg font-medium text-gray-900">{highlight.awardName}</p>
                      </div>
                      {highlight.awardingAgency && (
                        <div>
                          <p className="text-sm text-gray-500">Awarding Agency</p>
                          <p className="text-lg font-medium text-gray-900">{highlight.awardingAgency}</p>
                        </div>
                      )}
                      {highlight.awardYear && (
                        <div>
                          <p className="text-sm text-gray-500">Year</p>
                          <p className="text-lg font-medium text-gray-900">{highlight.awardYear}</p>
                        </div>
                      )}
                      {highlight.classification && (
                        <div>
                          <p className="text-sm text-gray-500">Classification</p>
                          <div className="space-y-1">
                            <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getClassificationColor(highlight.classification)}`}>
                              {getClassificationLabel(highlight.classification)}
                            </span>
                            {Object.values(HighlightClassification).includes(highlight.classification as HighlightClassification) && (
                              <p className="text-xs text-gray-500">
                                {classificationConfig[highlight.classification as HighlightClassification]?.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Achievement Summary */}
                {highlight.achievement && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Achievement</h2>
                    <p className="text-gray-700 text-lg leading-relaxed">{highlight.achievement}</p>
                  </div>
                )}

                {/* Citation Text */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Citation</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{highlight.citationText}</p>
                  </div>
                </div>

                {/* Supervisor Quote */}
                {highlight.supervisorQuote && (
                  <div className="bg-purple-50 border-l-4 border-purple-600 p-6">
                    <p className="text-sm font-medium text-purple-900 mb-2">Supervisor Quote</p>
                    <p className="text-purple-800 italic leading-relaxed">"{highlight.supervisorQuote}"</p>
                  </div>
                )}

                {/* Narrative */}
                {highlight.narrative && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Narrative</h2>
                    <p className="text-gray-700 leading-relaxed">{highlight.narrative}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="border-t pt-6 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span>Created {new Date(highlight.createdAt).toLocaleDateString()}</span>
                    </div>
                    {highlight.units.length > 0 && (
                      <div>
                        <span>Unit: {highlight.units.map(u => u.companyUnit).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button - Use This Highlight */}
                <div className="border-t pt-6">
                  <button
                    onClick={handleUseHighlight}
                    className="w-full flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-md hover:shadow-lg"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Use This Highlight for Digital Signage
                  </button>
                  <p className="text-sm text-gray-500 text-center mt-3">
                    This will take you to the digital signage builder with this highlight pre-filled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function HighlightViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HighlightViewContent />
    </Suspense>
  )
}
