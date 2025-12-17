'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, Save, Calendar, Sparkles, ExternalLink, Edit2, Trash2 } from 'lucide-react'
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
  linkedInPosts: LinkedInPost[]
}

interface LinkedInPost {
  id: string
  title?: string | null
  content: string
  status: string
  postedAt?: string | null
  createdAt: string
}

const contextTypeLabels: Record<string, string> = {
  EVENT: 'Event',
  MEETING: 'Meeting',
  DELIVERY: 'Delivery',
  RECOGNITION: 'Recognition',
  OTHER: 'Other',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  POSTED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

export default function MemoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const memoId = params.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [memo, setMemo] = useState<Memo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    whatHappened: '',
    whySpecial: '',
    myRole: '',
    impact: '',
    thoughts: '',
    contextType: 'OTHER',
    happenedAt: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadMemo()
      }
    }
  }, [router, memoId])

  async function loadMemo() {
    try {
      const response = await api.get(`/api/memo/${memoId}`)
      if (response.data.success) {
        const memoData = response.data.memo
        setMemo(memoData)
        setFormData({
          whatHappened: memoData.whatHappened,
          whySpecial: memoData.whySpecial || '',
          myRole: memoData.myRole || '',
          impact: memoData.impact || '',
          thoughts: memoData.thoughts || '',
          contextType: memoData.contextType,
          happenedAt: new Date(memoData.happenedAt).toISOString().split('T')[0],
        })
      }
    } catch (err: any) {
      console.error('Failed to load memo:', err)
      setError('Failed to load memo')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!formData.whatHappened.trim()) {
      setError('Please describe what happened')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await api.put(`/api/memo/${memoId}`, {
        whatHappened: formData.whatHappened,
        whySpecial: formData.whySpecial || undefined,
        myRole: formData.myRole || undefined,
        impact: formData.impact || undefined,
        thoughts: formData.thoughts || undefined,
        contextType: formData.contextType,
        happenedAt: new Date(formData.happenedAt).toISOString(),
      })

      if (response.data.success) {
        setMemo(response.data.memo)
        setIsEditing(false)
      }
    } catch (err: any) {
      console.error('Failed to update memo:', err)
      setError(err.response?.data?.error || 'Failed to update memo')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this memo? LinkedIn posts created from it will remain.')) {
      return
    }

    try {
      await api.delete(`/api/memo/${memoId}`)
      router.push('/mywork/memos')
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

  if (!memo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Memo not found</h2>
          <Link href="/mywork/memos" className="text-blue-600 hover:text-blue-700">
            Back to Memos
          </Link>
        </div>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/mywork/memos"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Memos
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Work Memo</h1>
                  <p className="text-gray-600 mt-2">
                    {new Date(memo.happenedAt).toLocaleDateString()} • {contextTypeLabels[memo.contextType]}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Content */}
            {isEditing ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        When did this happen?
                      </label>
                      <input
                        type="date"
                        value={formData.happenedAt}
                        onChange={(e) => handleChange('happenedAt', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Context Type
                      </label>
                      <select
                        value={formData.contextType}
                        onChange={(e) => handleChange('contextType', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="EVENT">Event</option>
                        <option value="MEETING">Meeting</option>
                        <option value="DELIVERY">Delivery</option>
                        <option value="RECOGNITION">Recognition</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What happened?
                    </label>
                    <textarea
                      value={formData.whatHappened}
                      onChange={(e) => handleChange('whatHappened', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why did this matter?
                    </label>
                    <textarea
                      value={formData.whySpecial}
                      onChange={(e) => handleChange('whySpecial', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What was your role?
                    </label>
                    <textarea
                      value={formData.myRole}
                      onChange={(e) => handleChange('myRole', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What was the impact?
                    </label>
                    <textarea
                      value={formData.impact}
                      onChange={(e) => handleChange('impact', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal reflections
                    </label>
                    <textarea
                      value={formData.thoughts}
                      onChange={(e) => handleChange('thoughts', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadMemo()
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">What Happened</h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{memo.whatHappened}</p>
                  </div>

                  {memo.whySpecial && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Why It Mattered</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{memo.whySpecial}</p>
                    </div>
                  )}

                  {memo.myRole && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">My Role</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{memo.myRole}</p>
                    </div>
                  )}

                  {memo.impact && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Impact</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{memo.impact}</p>
                    </div>
                  )}

                  {memo.thoughts && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Reflections</h3>
                      <p className="text-gray-900 whitespace-pre-wrap">{memo.thoughts}</p>
                    </div>
                  )}
                </div>

                {/* LinkedIn CTA */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Sparkles className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Share this moment on LinkedIn
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Turn this memo into a professional LinkedIn post with AI assistance
                      </p>
                      <Link
                        href={`/mywork/memos/${memoId}/linkedin/draft`}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Sparkles className="w-5 h-5" />
                        <span>Draft LinkedIn Post</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* LinkedIn Posts History */}
                {memo.linkedInPosts && memo.linkedInPosts.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">LinkedIn Posts</h3>
                    <div className="space-y-4">
                      {memo.linkedInPosts.map((post) => (
                        <div
                          key={post.id}
                          className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              {post.title && (
                                <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                              )}
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[post.status]}`}>
                                {post.status}
                              </span>
                            </div>
                            <Link
                              href={`/mywork/linkedin/${post.id}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </Link>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-3">
                            {post.content}
                          </p>
                          <p className="text-sm text-gray-500 mt-4">
                            {post.postedAt
                              ? `Posted ${new Date(post.postedAt).toLocaleDateString()}`
                              : `Created ${new Date(post.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
