'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, Sparkles } from 'lucide-react'
import api from '@/lib/api'

interface SeniorLeaderTopic {
  id: string
  topic: string
  description: string | null
  createdAt: string
}

interface SignalArtifact {
  id: string
  title: string | null
  content: string
  saidBy: string | null
  role: string | null
  source: string | null
  createdAt: string
  topics: SeniorLeaderTopic[]
}

export default function SignalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [artifact, setArtifact] = useState<SignalArtifact | null>(null)

  useEffect(() => {
    if (id) {
      loadArtifact()
    }
  }, [id])

  async function loadArtifact() {
    try {
      setLoading(true)
      const response = await api.get(`/api/signal/${id}`)
      
      if (response.data.success) {
        setArtifact(response.data.artifact)
      } else {
        alert('Failed to load signal artifact')
        router.push('/signal')
      }
    } catch (error: any) {
      console.error('Failed to load signal artifact:', error)
      alert('Failed to load signal artifact')
      router.push('/signal')
    } finally {
      setLoading(false)
    }
  }

  async function handleParseTopics() {
    if (!artifact) return

    try {
      setParsing(true)
      const response = await api.post(`/api/signal/${id}/parse-topics`)
      
      if (response.data.success) {
        // Reload artifact to get new topics
        await loadArtifact()
      } else {
        alert('Failed to parse topics')
      }
    } catch (error: any) {
      console.error('Failed to parse topics:', error)
      alert(error.response?.data?.error || 'Failed to parse topics')
    } finally {
      setParsing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!artifact) {
    return null
  }

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
            <Link
              href="/signal"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Signals
            </Link>

            <div className="bg-white rounded-lg shadow p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {artifact.title || '(Untitled Signal)'}
                  </h1>
                  {artifact.saidBy && (
                    <div className="text-gray-600">
                      <span className="font-medium">{artifact.saidBy}</span>
                      {artifact.role && <span className="ml-2">({artifact.role})</span>}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    Created {new Date(artifact.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={handleParseTopics}
                  disabled={parsing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-5 w-5" />
                  {parsing ? 'Parsing...' : 'Parse Senior Leader Topics'}
                </button>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Content</h2>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {artifact.content}
                </div>
              </div>
            </div>

            {/* Parsed Topics Section */}
            {artifact.topics.length > 0 && (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Parsed Topics (Draft)</h2>
                  <p className="text-sm text-gray-500 italic">
                    Interpretive notes — not authoritative
                  </p>
                </div>

                <div className="space-y-4">
                  {artifact.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.topic}</h3>
                      {topic.description && (
                        <p className="text-gray-600">{topic.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {artifact.topics.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No topics parsed yet</h3>
                <p className="text-gray-600 mb-4">
                  Click "Parse Senior Leader Topics" to extract high-level themes from this content.
                </p>
                <button
                  onClick={handleParseTopics}
                  disabled={parsing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-5 w-5" />
                  {parsing ? 'Parsing...' : 'Parse Topics'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}





