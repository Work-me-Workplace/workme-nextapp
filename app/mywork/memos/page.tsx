'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Plus, Calendar, Sparkles, Trash2, Edit, ExternalLink } from 'lucide-react'
import api from '@/lib/api'

interface Memo {
  id: string
  whatHappened: string
  whySpecial?: string | null
  myRole?: string | null
  impact?: string | null
  thoughts?: string | null
  contextType: string
  happenedAt: string
  createdAt: string
  _count: {
    linkedInPosts: number
  }
}

const contextTypeLabels: Record<string, string> = {
  EVENT: 'Event',
  MEETING: 'Meeting',
  DELIVERY: 'Delivery',
  RECOGNITION: 'Recognition',
  OTHER: 'Other',
}

const contextTypeColors: Record<string, string> = {
  EVENT: 'bg-purple-100 text-purple-800',
  MEETING: 'bg-blue-100 text-blue-800',
  DELIVERY: 'bg-green-100 text-green-800',
  RECOGNITION: 'bg-yellow-100 text-yellow-800',
  OTHER: 'bg-gray-100 text-gray-800',
}

export default function MemosPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadMemos()
      }
    }
  }, [router])

  async function loadMemos() {
    try {
      const response = await api.get('/api/memo/list')
      if (response.data.success) {
        setMemos(response.data.memos || [])
      }
    } catch (err: any) {
      console.error('Failed to load memos:', err)
      setError('Failed to load memos')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(memoId: string) {
    if (!confirm('Delete this memo? LinkedIn posts created from it will remain.')) {
      return
    }

    try {
      await api.delete(`/api/memo/${memoId}`)
      setMemos(memos.filter(m => m.id !== memoId))
    } catch (err: any) {
      console.error('Failed to delete memo:', err)
      alert('Failed to delete memo')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Work Memos</h1>
                <p className="text-gray-600 mt-2">Capture and preserve meaningful work moments</p>
              </div>
              <Link
                href="/mywork/memos/new"
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Capture Work Moment</span>
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Memos List */}
            {memos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No memos yet</h3>
                <p className="text-gray-600 mb-6">Start capturing meaningful work moments</p>
                <Link
                  href="/mywork/memos/new"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Your First Memo</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {memos.map((memo) => (
                  <div
                    key={memo.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Context Badge */}
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${contextTypeColors[memo.contextType] || contextTypeColors.OTHER}`}>
                          {contextTypeLabels[memo.contextType] || memo.contextType}
                        </span>

                        {/* What Happened */}
                        <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-2">
                          {memo.whatHappened}
                        </h3>

                        {/* Why Special */}
                        {memo.whySpecial && (
                          <p className="text-gray-700 mb-2">
                            <span className="font-medium">Why it matters:</span> {memo.whySpecial}
                          </p>
                        )}

                        {/* Impact */}
                        {memo.impact && (
                          <p className="text-gray-700 mb-2">
                            <span className="font-medium">Impact:</span> {memo.impact}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(memo.happenedAt).toLocaleDateString()}</span>
                          </span>
                          {memo._count.linkedInPosts > 0 && (
                            <span className="flex items-center space-x-1 text-blue-600">
                              <ExternalLink className="w-4 h-4" />
                              <span>{memo._count.linkedInPosts} LinkedIn post{memo._count.linkedInPosts > 1 ? 's' : ''}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/mywork/memos/${memo.id}`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View & Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(memo.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
