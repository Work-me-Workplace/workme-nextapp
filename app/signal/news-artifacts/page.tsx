'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Newspaper, Loader2, ArrowLeft, ExternalLink, Eye } from 'lucide-react'

interface NewsArtifact {
  id: string
  headline: string | null
  sourceName: string | null
  sourceUrl: string | null
  rawText: string
  aiSummary: string | null
  artifactType: string | null
  sentiment: string | null
  createdAt: string
  updatedAt: string
  _count: {
    milestones: number
    externalEnv: number
    platformStatements: number
    platformUnitStatements: number
  }
}

export default function NewsArtifactsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [artifacts, setArtifacts] = useState<NewsArtifact[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setAuthReady(true)
        let id = getWorkMeIdFromStorage()
        
        if (!id) {
          try {
            const refreshed = await refreshWorkMe()
            if (refreshed) {
              id = refreshed.id
            }
          } catch (error) {
            console.error('Failed to refresh WorkMe:', error)
          }
        }
        
        if (id) {
          setWorkMeId(id)
          loadArtifacts()
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router])

  async function loadArtifacts() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/api/utils/news-artifact/list')

      if (response.data.success && response.data.artifacts) {
        setArtifacts(response.data.artifacts)
      } else {
        setError(response.data.error || 'Failed to load news artifacts')
        setArtifacts([])
      }
    } catch (error: any) {
      console.error('Failed to load news artifacts:', error)
      setError(error.response?.data?.error || error.message || 'Failed to load news artifacts')
      setArtifacts([])
    } finally {
      setLoading(false)
    }
  }

  if (!authReady || !workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/signal"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Global Artifacts
            </Link>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Newspaper className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">News Artifacts</h1>
              </div>
              <p className="text-gray-600">Browse and manage all saved news articles and press releases</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            ) : artifacts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No news artifacts yet</h3>
                <p className="text-gray-600 mb-6">News artifacts are created when you ingest articles through the Clip Parser or other signal tools.</p>
                <Link
                  href="/signal/clip"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create News Artifact
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Headline / Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Used By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {artifacts.map((artifact) => {
                      const totalUsed = artifact._count.milestones + 
                                      artifact._count.externalEnv + 
                                      artifact._count.platformStatements + 
                                      artifact._count.platformUnitStatements

                      return (
                        <tr key={artifact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {artifact.headline || artifact.sourceName || '(Untitled)'}
                            </div>
                            {artifact.sourceName && (
                              <div className="text-xs text-gray-500 mt-1">{artifact.sourceName}</div>
                            )}
                            {artifact.sourceUrl && (
                              <a
                                href={artifact.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Source
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {artifact.artifactType || '-'}
                            </div>
                            {artifact.sentiment && (
                              <div className="text-xs text-gray-500">{artifact.sentiment}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {totalUsed} {totalUsed === 1 ? 'entity' : 'entities'}
                            </div>
                            {totalUsed > 0 && (
                              <div className="text-xs text-gray-500">
                                {[
                                  artifact._count.milestones > 0 && `${artifact._count.milestones} milestone${artifact._count.milestones > 1 ? 's' : ''}`,
                                  artifact._count.externalEnv > 0 && `${artifact._count.externalEnv} env`,
                                  artifact._count.platformStatements > 0 && `${artifact._count.platformStatements} platform`,
                                  artifact._count.platformUnitStatements > 0 && `${artifact._count.platformUnitStatements} unit`,
                                ].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(artifact.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/signal/clip/${artifact.id}/parse`}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Parse
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
