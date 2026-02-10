'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

export default function SeniorSignalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      alert('Content is required')
      return
    }

    try {
      setLoading(true)
      // Signal section: just create SignalArtifact (raw signal, no topics)
      const response = await api.post('/api/signal/create', {
        content: content.trim(),
        source: 'senior_leader_email',
      })

      if (response.data.success) {
        // Signal section: just store raw SignalArtifact, no topic parsing
        router.push(`/signal/${response.data.artifact.id}`)
      } else {
        alert('Failed to create signal artifact')
      }
    } catch (error: any) {
      console.error('Failed to create signal artifact:', error)
      alert(error.response?.data?.error || 'Failed to create signal artifact')
    } finally {
      setLoading(false)
    }
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
              Back to Global Artifacts
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Leader Email Signal</h1>
              <p className="text-gray-600 mb-6">Raw signal artifact - something to watch, don't know yet. Just paste content below.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={25}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste the full email content here..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Raw SignalArtifact only - no topic parsing, no metadata. Just raw content dump.
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <Link
                    href="/signal"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Signal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
