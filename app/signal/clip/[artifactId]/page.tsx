'use client'

import Link from 'next/link'
import { use, useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { refreshWorkMe } from '@/lib/workme.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Newspaper, ArrowLeft, Wand2, ExternalLink, Loader2 } from 'lucide-react'

interface NewsArtifact {
  id: string
  headline: string | null
  rawText: string
  sourceUrl: string | null
  sourceName: string | null
  artifactType: string | null
  createdAt: string
}

function ClipViewContent({ params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [artifact, setArtifact] = useState<NewsArtifact | null>(null)
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
            if (refreshed) id = refreshed.id
          } catch (e) {
            console.error('Failed to refresh WorkMe:', e)
          }
        }
        if (id) {
          setWorkMeId(id)
        } else {
          router.push('/signin')
        }
      } else {
        router.push('/signin')
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!authReady || !workMeId || !artifactId) return
    loadArtifact()
  }, [authReady, workMeId, artifactId])

  async function loadArtifact() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/api/utils/news-artifact/${artifactId}`)
      if (response.data.success && response.data.data) {
        setArtifact(response.data.data)
      } else {
        setError(response.data.error || 'Article not found')
      }
    } catch (err: any) {
      console.error('Failed to load article:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  if (!authReady || !workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
              href="/mycompany/articles"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Global Artifacts
            </Link>

            <div className="bg-white rounded-lg shadow-md p-8">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                  <Link href="/mycompany/articles" className="mt-2 inline-block text-sm text-red-600 hover:underline">
                    ← Back to Global Artifacts
                  </Link>
                </div>
              ) : artifact ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center">
                      <Newspaper className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">Article</h1>
                        <p className="text-sm text-gray-500">
                          {new Date(artifact.createdAt).toLocaleDateString()}
                          {artifact.sourceName && ` · ${artifact.sourceName}`}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/signal/clip/${artifactId}/parse`}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Parse & Route
                    </Link>
                  </div>

                  {artifact.headline && (
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{artifact.headline}</h2>
                  )}

                  {artifact.sourceUrl && (
                    <p className="mb-4">
                      <a
                        href={artifact.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {artifact.sourceUrl}
                      </a>
                    </p>
                  )}

                  {artifact.artifactType && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium mb-4">
                      {artifact.artifactType.replace('_', ' ')}
                    </span>
                  )}

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Article text</p>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-mono text-sm">
                      {artifact.rawText}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{artifact.rawText.length} characters</p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ClipViewPage({ params }: { params: Promise<{ artifactId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <ClipViewContent params={params} />
    </Suspense>
  )
}
