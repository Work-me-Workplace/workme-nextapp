'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'

interface StandaloneOutput {
  id: string
  outputType: string
  title: string
  description?: string
  draftContent?: any
  metadata?: any
  updatedAt: string
  createdAt: string
}

export default function ViewEditOutputPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [output, setOutput] = useState<StandaloneOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    draftContent: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const workMeIdValue = getWorkMeIdFromStorage()
      if (!workMeIdValue) {
        router.push('/signin')
      } else {
        setWorkMeId(workMeIdValue)
        loadOutput()
      }
    }
  }, [id, router])

  async function loadOutput() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/output-standalone/${id}`)
      const result = await response.json()

      if (result.success) {
        const data = result.data
        setOutput(data)
        setFormData({
          title: data.title,
          description: data.description || '',
          draftContent: typeof data.draftContent === 'object' && data.draftContent?.content
            ? data.draftContent.content
            : typeof data.draftContent === 'string'
            ? data.draftContent
            : '',
        })
      } else {
        setError(result.error || 'Failed to load output')
      }
    } catch (err: any) {
      console.error('Failed to load output:', err)
      setError(err.message || 'Failed to load output')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/output-standalone/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          draftContent: formData.draftContent ? { content: formData.draftContent } : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setIsEditing(false)
        await loadOutput() // Reload to get updated data
      } else {
        setError(result.error || 'Failed to update output')
      }
    } catch (err: any) {
      console.error('Failed to update output:', err)
      setError(err.message || 'Failed to update output')
    } finally {
      setSaving(false)
    }
  }

  function formatOutputType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase())
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!output) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Output not found'}</p>
          <Link
            href="/mywork/outputs"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Outputs
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/signin')
                }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <SidebarNav />

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link
                href="/mywork/outputs"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
              >
                ← Back to Outputs
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {isEditing ? 'Edit Output' : output.title}
                  </h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatOutputType(output.outputType)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Last updated {new Date(output.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="draftContent" className="block text-sm font-medium text-gray-700 mb-2">
                      Draft Content
                    </label>
                    <textarea
                      id="draftContent"
                      rows={12}
                      value={formData.draftContent}
                      onChange={(e) => setFormData({ ...formData, draftContent: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form data
                        setFormData({
                          title: output.title,
                          description: output.description || '',
                          draftContent: typeof output.draftContent === 'object' && output.draftContent?.content
                            ? output.draftContent.content
                            : typeof output.draftContent === 'string'
                            ? output.draftContent
                            : '',
                        })
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {output.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                      <p className="text-gray-900">{output.description}</p>
                    </div>
                  )}

                  {formData.draftContent && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Draft Content</h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                          {formData.draftContent}
                        </pre>
                      </div>
                    </div>
                  )}

                  {!output.description && !formData.draftContent && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No content yet. Click Edit to add content.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

