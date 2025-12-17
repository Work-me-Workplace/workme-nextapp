'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, Sparkles, RefreshCw, Save, Send } from 'lucide-react'
import api from '@/lib/api'

interface Memo {
  id: string
  whatHappened: string
  contextType: string
}

const tones = [
  { value: 'professional', label: 'Professional', description: 'Polished and suitable for broad audience' },
  { value: 'appreciative', label: 'Appreciative', description: 'Warm and grateful' },
  { value: 'reflective', label: 'Reflective', description: 'Thoughtful and insightful' },
  { value: 'celebratory', label: 'Celebratory', description: 'Enthusiastic and positive' },
]

export default function LinkedInDraftPage() {
  const router = useRouter()
  const params = useParams()
  const memoId = params.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [memo, setMemo] = useState<Memo | null>(null)
  
  const [selectedTone, setSelectedTone] = useState('professional')
  const [generatedContent, setGeneratedContent] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [title, setTitle] = useState('')
  
  const [generating, setGenerating] = useState(false)
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
        loadMemo()
      }
    }
  }, [router, memoId])

  async function loadMemo() {
    try {
      const response = await api.get(`/api/memo/${memoId}`)
      if (response.data.success) {
        setMemo(response.data.memo)
      }
    } catch (err: any) {
      console.error('Failed to load memo:', err)
      setError('Failed to load memo')
    }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const response = await api.post(`/api/memo/${memoId}/generate-linkedin`, {
        tone: selectedTone,
      })

      if (response.data.success) {
        const content = response.data.content
        setGeneratedContent(content)
        setEditedContent(content)
      }
    } catch (err: any) {
      console.error('Failed to generate LinkedIn post:', err)
      setError(err.response?.data?.error || 'Failed to generate post')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveDraft() {
    if (!editedContent.trim()) {
      setError('Content cannot be empty')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await api.post('/api/linkedin/draft', {
        memoId,
        title: title || undefined,
        content: editedContent,
      })

      if (response.data.success) {
        router.push(`/mywork/linkedin/${response.data.linkedInPost.id}`)
      }
    } catch (err: any) {
      console.error('Failed to save draft:', err)
      setError(err.response?.data?.error || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndPost() {
    if (!editedContent.trim()) {
      setError('Content cannot be empty')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // First save the draft
      const draftResponse = await api.post('/api/linkedin/draft', {
        memoId,
        title: title || undefined,
        content: editedContent,
      })

      if (draftResponse.data.success) {
        const postId = draftResponse.data.linkedInPost.id
        
        // Then post to LinkedIn
        setPosting(true)
        const postResponse = await api.post(`/api/linkedin/${postId}/post`)
        
        if (postResponse.data.success) {
          router.push(`/mywork/linkedin/${postId}`)
        }
      }
    } catch (err: any) {
      console.error('Failed to post:', err)
      setError(err.response?.data?.error || 'Failed to post')
    } finally {
      setSaving(false)
      setPosting(false)
    }
  }

  if (!memo) {
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                href={`/mywork/memos/${memoId}`}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Memo
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Draft LinkedIn Post</h1>
              <p className="text-gray-600 mt-2">
                Generate and customize your LinkedIn post with AI
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Tone Selector */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Tone</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tones.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setSelectedTone(tone.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedTone === tone.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{tone.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{tone.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              {!generatedContent && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-all shadow-md"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate LinkedIn Post</span>
                    </>
                  )}
                </button>
              )}

              {/* Generated Content */}
              {generatedContent && (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Your LinkedIn Post</h3>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    {/* Optional Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Internal Title (optional)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Project Launch Post"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Editable Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Post Content
                      </label>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans"
                        placeholder="Edit your post..."
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        {editedContent.length} characters
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving || posting}
                      className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 font-medium transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                    </button>
                    <button
                      onClick={handleSaveAndPost}
                      disabled={saving || posting}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      <Send className="w-5 h-5" />
                      <span>{posting ? 'Posting...' : 'Save & Post to LinkedIn'}</span>
                    </button>
                  </div>

                  {/* Note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Nothing is saved until you click "Save Draft" or "Save & Post to LinkedIn". 
                      You can regenerate as many times as you like.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
