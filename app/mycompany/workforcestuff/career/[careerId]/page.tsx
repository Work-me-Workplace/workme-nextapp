'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { WorkProductContainer } from '@/components/workproduct/WorkProductContainer'
import { FileText, ExternalLink, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

interface CompanyCareer {
  id: string
  title: string
  description: string | null
  level: 'NAVSEA' | 'NAVY' | 'DOD' | null
  type: 'Leadership' | 'Fellowship' | 'Other' | null
  eligibility: {
    paygradeRange: { min: string | null; max: string | null }
    timeInServiceMonths: number | null
    timeInPositionMonths: number | null
    who: string | null
  } | null
  application: {
    instructions: string | null
    link: string | null
  } | null
  extras: {
    cost: string | null
    notes: string[] | null
  } | null
  ingestRawText: string | null
  createdAt: string
}

export default function CareerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const careerId = params?.careerId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [career, setCareer] = useState<CompanyCareer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadCareer()
      }
    }
  }, [router, careerId])

  async function loadCareer() {
    try {
      setLoading(true)
      const response = await api.get(`/api/workforcestuff/career/${careerId}`)
      
      if (response.data.success && response.data.career) {
        setCareer(response.data.career)
      } else {
        console.error('Failed to load career:', response.data.error)
      }
    } catch (error) {
      console.error('Failed to load career:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!career) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
            ← Back to Workforce Stuff
          </Link>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Not Found</h3>
            <p className="text-gray-600">The career opportunity you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    )
  }

  const eligibility = career.eligibility
  const application = career.application
  const extras = career.extras

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
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
            <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Workforce Stuff
            </Link>

            <WorkProductContainer
              source={{
                id: career.id,
                type: 'career',
                title: career.title,
                description: career.description,
                summary: career.description,
              }}
              layout="stack"
            >
            <div className="bg-white rounded-lg shadow p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Career
                      </span>
                      {career.level && (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {career.level}
                        </span>
                      )}
                      {career.type && (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {career.type}
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {career.title}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Description */}
              {career.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{career.description}</p>
                </div>
              )}

              {/* Eligibility */}
              {eligibility && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Eligibility</h2>
                  <div className="space-y-3">
                    {(eligibility.paygradeRange?.min || eligibility.paygradeRange?.max) && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Paygrade Range</p>
                        <p className="text-gray-900 font-medium">
                          {eligibility.paygradeRange.min || 'N/A'} - {eligibility.paygradeRange.max || 'N/A'}
                        </p>
                      </div>
                    )}
                    {eligibility.timeInServiceMonths && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Time In Service</p>
                        <p className="text-gray-900 font-medium">{eligibility.timeInServiceMonths} months</p>
                      </div>
                    )}
                    {eligibility.timeInPositionMonths && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Time In Position</p>
                        <p className="text-gray-900 font-medium">{eligibility.timeInPositionMonths} months</p>
                      </div>
                    )}
                    {eligibility.who && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Who</p>
                        <p className="text-gray-700">{eligibility.who}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application */}
              {application && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Application
                  </h2>
                  <div className="space-y-3">
                    {application.instructions && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Instructions</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{application.instructions}</p>
                      </div>
                    )}
                    {application.link && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Application Link</p>
                        <a
                          href={application.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                        >
                          {application.link}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extras */}
              {extras && (extras.cost || (extras.notes && extras.notes.length > 0)) && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                  <div className="space-y-3">
                    {extras.cost && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Cost</p>
                        <p className="text-gray-700">{extras.cost}</p>
                      </div>
                    )}
                    {extras.notes && extras.notes.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Notes</p>
                        <ul className="list-disc list-inside space-y-1">
                          {extras.notes.map((note, index) => (
                            <li key={index} className="text-gray-700">{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Text (Optional) */}
              {career.ingestRawText && (
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Original Text</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{career.ingestRawText}</pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-6 text-sm text-gray-500">
                <p>Created: {new Date(career.createdAt).toLocaleString()}</p>
              </div>
            </div>
            </WorkProductContainer>
          </div>
        </main>
      </div>
    </div>
  )
}

