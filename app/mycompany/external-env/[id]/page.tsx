'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { AlertCircle, ArrowLeft, ExternalLink, Loader2, Newspaper } from 'lucide-react'
import api from '@/lib/api'

interface ExternalEnv {
  id: string
  source: string
  category: string | null
  summary: string
  impact: string | null
  deltaSummary: string | null
  implementationTimeline: string | null
  leadAuthority: string | null
  confidenceLevel: string | null
  timeHorizon: string | null
  createdAt: string
  updatedAt: string
  newsArtifact: {
    id: string
    headline: string | null
    sourceName: string | null
    sourceUrl: string | null
  } | null
  platformUnit: {
    id: string
    name: string
    hullNumber: string | null
  } | null
  platformProduct: {
    id: string
    name: string
  } | null
  milestone: {
    id: string
    title: string | null
    category: string | null
  } | null
}

export default function ExternalEnvDetailPage() {
  const params = useParams()
  const router = useRouter()
  const externalEnvId = params?.id as string
  
  const [externalEnv, setExternalEnv] = useState<ExternalEnv | null>(null)
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadExternalEnv()
      }
    }
  }, [externalEnvId, router])

  async function loadExternalEnv() {
    try {
      setLoading(true)
      const response = await api.get(`/api/company/external-env/${externalEnvId}`)
      
      if (response.data.success && response.data.data) {
        setExternalEnv(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load external environment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
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
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading external environment...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!externalEnv) {
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
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">External Environment Not Found</h3>
                <Link href="/mycompany" className="text-blue-600 hover:text-blue-700">
                  Back to My Company
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
            <Link href="/mycompany" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Company
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center mb-6">
                <AlertCircle className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{externalEnv.source}</h1>
                  {externalEnv.category && (
                    <p className="text-gray-600 mt-1">Category: {externalEnv.category}</p>
                  )}
                </div>
              </div>

              {/* News Artifact Link */}
              {externalEnv.newsArtifact && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <Newspaper className="h-4 w-4 mr-2" />
                        News Source
                      </h3>
                      <p className="text-gray-900 font-medium mb-1">
                        {externalEnv.newsArtifact.headline || externalEnv.newsArtifact.sourceName || 'News Article'}
                      </p>
                      {externalEnv.newsArtifact.sourceName && (
                        <p className="text-sm text-gray-500 mb-2">{externalEnv.newsArtifact.sourceName}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <Link
                          href={`/signal/clip/${externalEnv.newsArtifact.id}/parse`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          View & Parse News Artifact
                        </Link>
                        {externalEnv.newsArtifact.sourceUrl && (
                          <a
                            href={externalEnv.newsArtifact.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View original article
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Signal Basics */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{externalEnv.summary}</p>
              </div>

              {externalEnv.impact && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Impact</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{externalEnv.impact}</p>
                </div>
              )}

              {/* Change Intelligence */}
              {(externalEnv.deltaSummary || externalEnv.implementationTimeline || externalEnv.leadAuthority) && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Intelligence</h2>
                  <div className="space-y-4">
                    {externalEnv.deltaSummary && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Delta Summary</h3>
                        <p className="text-gray-700">{externalEnv.deltaSummary}</p>
                      </div>
                    )}
                    {externalEnv.implementationTimeline && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Implementation Timeline</h3>
                        <p className="text-gray-700">{externalEnv.implementationTimeline}</p>
                      </div>
                    )}
                    {externalEnv.leadAuthority && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Lead Authority</h3>
                        <p className="text-gray-700">{externalEnv.leadAuthority}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {(externalEnv.confidenceLevel || externalEnv.timeHorizon) && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {externalEnv.confidenceLevel && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Confidence Level</h3>
                        <p className="text-gray-700 capitalize">{externalEnv.confidenceLevel}</p>
                      </div>
                    )}
                    {externalEnv.timeHorizon && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Time Horizon</h3>
                        <p className="text-gray-700 capitalize">{externalEnv.timeHorizon}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Related Links */}
              {(externalEnv.platformUnit || externalEnv.platformProduct || externalEnv.milestone) && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Related</h2>
                  <div className="space-y-2">
                    {externalEnv.platformUnit && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Platform Unit: </span>
                        <Link
                          href={`/mycompany/platforms/units/${externalEnv.platformUnit.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {externalEnv.platformUnit.name || externalEnv.platformUnit.hullNumber}
                        </Link>
                      </div>
                    )}
                    {externalEnv.platformProduct && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Platform Product: </span>
                        <Link
                          href={`/mycompany/platforms/${externalEnv.platformProduct.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {externalEnv.platformProduct.name}
                        </Link>
                      </div>
                    )}
                    {externalEnv.milestone && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Milestone: </span>
                        <Link
                          href={`/mycompany/milestones/${externalEnv.milestone.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {externalEnv.milestone.title || 'Milestone'}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Created: {new Date(externalEnv.createdAt).toLocaleDateString()}
                  {externalEnv.updatedAt !== externalEnv.createdAt && (
                    <span className="ml-4">Updated: {new Date(externalEnv.updatedAt).toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
