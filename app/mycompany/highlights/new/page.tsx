'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Sparkles, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

export default function NewHighlightPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
      }
    }
  }, [router])

  async function handleGenerate() {
    if (!rawText.trim()) {
      setError('Please enter citation text')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/company/highlights/create', {
        rawText: rawText.trim(),
      })

      if (response.data.success) {
        router.push(`/mycompany/highlights/${response.data.highlightId}`)
      } else {
        setError(response.data.error || 'Failed to create highlight')
      }
    } catch (err: any) {
      console.error('Failed to create highlight:', err)
      setError(err.response?.data?.error || err.message || 'Failed to create highlight')
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/mycompany/highlights"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Highlights
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center mb-6">
                <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
                <h1 className="text-3xl font-bold text-gray-900">Add Employee Highlight</h1>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                This uses AI to parse and structure award citations, highlights, and recognition writeups.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                    Paste Award Citation or Highlight Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="rawText"
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Paste the full award citation, recognition text, or highlight writeup here..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Link
                    href="/mycompany/highlights"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !rawText.trim()}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Highlight
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

