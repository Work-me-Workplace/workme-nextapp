'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/lib/providers/AuthProvider'

export default function NewOneOffEmailPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
  })

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!session.firebaseId) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Implement one-off email creation
    alert('One-off email creation coming soon!')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce/enduring/email-digest" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/workforce/enduring/email-digest"
          className="text-purple-600 hover:text-purple-700 mb-4 inline-block text-sm"
        >
          ← Back to Email Digest Builder
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create One-Off Email Digest</h2>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 mb-1">Single Email Digest</h3>
                  <p className="text-sm text-purple-800">
                    This creates a <strong>one-time email digest</strong> (not part of a recurring series). Perfect
                    for special announcements or ad-hoc updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Email Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
                placeholder="e.g., Important Update - December 2025"
              />
              <p className="mt-1 text-xs text-gray-500">The subject line for this email</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex">
                <svg
                  className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-900 mb-2">🚧 Content Selection UI Coming Soon</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    This is where you'll select which company content to include in your one-off email:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>• Select from events, campaigns, trainings, benefits, etc.</li>
                    <li>• Reorder items as needed</li>
                    <li>• Add custom notes for each item</li>
                    <li>• Generate AI-powered content instantly</li>
                  </ul>
                  <p className="text-sm text-yellow-800 mt-3">
                    We're building this feature now. Check back soon!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/workforce/enduring/email-digest')}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Back to Builder
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Continue (Coming Soon)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
