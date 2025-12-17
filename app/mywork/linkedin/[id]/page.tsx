'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, Edit2, Save, Send, Trash2, ExternalLink, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import api from '@/lib/api'

interface LinkedInPost {
  id: string
  title?: string | null
  content: string
  status: string
  postedAt?: string | null
  linkedinPostUrn?: string | null
  errorMessage?: string | null
  createdAt: string
  memo?: {
    id: string
    whatHappened: string
    happenedAt: string
  } | null
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertCircle,
  },
  POSTED: {
    label: 'Posted',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle2,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
}

export default function LinkedInPostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [post, setPost] = useState<LinkedInPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadPost()
      }
    }
  }, [router, postId])

  async function loadPost() {
    try {
      const response = await api.get(`/api/linkedin/${postId}`)
      if (response.data.success) {
        const postData = response.data.linkedInPost
        setPost(postData)
        setEditedTitle(postData.title || '')
        setEditedContent(postData.content)
      }
    } catch (err: any) {
      console.error('Failed to load post:', err)
      setError('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!editedContent.trim()) {
      setError('Content cannot be empty')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await api.put(`/api/linkedin/${postId}`, {
        title: editedTitle || undefined,
        content: editedContent,
      })

      if (response.data.success) {
        setPost(response.data.linkedInPost)
        setIsEditing(false)
      }
    } catch (err: any) {
      console.error('Failed to update post:', err)
      setError(err.response?.data?.error || 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  async function handlePost() {
    if (!confirm('Post this to LinkedIn?')) {
      return
    }

    setPosting(true)
    setError(null)

    try {
      const response = await api.post(`/api/linkedin/${postId}/post`)

      if (response.data.success) {
        setPost(response.data.linkedInPost)
      }
    } catch (err: any) {
      console.error('Failed to post:', err)
      setError(err.response?.data?.error || 'Failed to post to LinkedIn')
      // Reload to get updated error status
      loadPost()
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this LinkedIn post draft?')) {
      return
    }

    try {
      await api.delete(`/api/linkedin/${postId}`)
      if (post?.memo) {
        router.push(`/mywork/memos/${post.memo.id}`)
      } else {
        router.push('/mywork/memos')
      }
    } catch (err: any) {
      console.error('Failed to delete post:', err)
      alert('Failed to delete post')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h2>
          <Link href="/mywork/memos" className="text-blue-600 hover:text-blue-700">
            Back to Memos
          </Link>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[post.status as keyof typeof statusConfig] || statusConfig.DRAFT
  const StatusIcon = statusInfo.icon

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
                href={post.memo ? `/mywork/memos/${post.memo.id}` : '/mywork/memos'}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {post.memo ? 'Back to Memo' : 'Back to Memos'}
              </Link>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {post.title || 'LinkedIn Post'}
                  </h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{statusInfo.label}</span>
                    </span>
                    {post.postedAt && (
                      <span className="text-gray-600 text-sm">
                        Posted {new Date(post.postedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {post.status !== 'POSTED' && !isEditing && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      {post.status !== 'POSTED' && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      )}
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

            {/* Error Message from Failed Post */}
            {post.status === 'FAILED' && post.errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900 mb-1">Posting Failed</h3>
                    <p className="text-sm text-red-700">{post.errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Source Memo */}
            {post.memo && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-blue-900">
                  <ExternalLink className="w-4 h-4" />
                  <span>Created from memo:</span>
                  <Link
                    href={`/mywork/memos/${post.memo.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.memo.whatHappened.substring(0, 80)}
                    {post.memo.whatHappened.length > 80 ? '...' : ''}
                  </Link>
                </div>
              </div>
            )}

            {/* Content */}
            {isEditing ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Internal Title (optional)
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="e.g., Project Launch Post"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Content
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {editedContent.length} characters
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedTitle(post.title || '')
                      setEditedContent(post.content)
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
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <p className="text-gray-900 whitespace-pre-wrap text-lg leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Post to LinkedIn */}
                {(post.status === 'DRAFT' || post.status === 'FAILED') && (
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Ready to share?
                        </h3>
                        <p className="text-gray-600">
                          {post.status === 'FAILED' 
                            ? 'Try posting to LinkedIn again' 
                            : 'Post this to your LinkedIn profile'}
                        </p>
                      </div>
                      <button
                        onClick={handlePost}
                        disabled={posting}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                      >
                        <Send className="w-5 h-5" />
                        <span>{posting ? 'Posting...' : 'Post to LinkedIn'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Posted Successfully */}
                {post.status === 'POSTED' && (
                  <div className="mt-6 bg-green-50 rounded-lg border border-green-200 p-6">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-1">
                          Successfully posted to LinkedIn
                        </h3>
                        <p className="text-sm text-green-700 mb-3">
                          Posted on {new Date(post.postedAt!).toLocaleDateString()} at{' '}
                          {new Date(post.postedAt!).toLocaleTimeString()}
                        </p>
                        {post.linkedinPostUrn && (
                          <p className="text-xs text-green-600 font-mono">
                            {post.linkedinPostUrn}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="mt-6 text-sm text-gray-500">
                  Created {new Date(post.createdAt).toLocaleDateString()} at{' '}
                  {new Date(post.createdAt).toLocaleTimeString()}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
