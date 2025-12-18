'use client'

import Link from 'next/link'
import { use, useState, useEffect } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useSearchParams } from 'next/navigation'

export default function CurateEditionPage({
  params,
}: {
  params: Promise<{ emailDigestId: string; editionId: string }>
}) {
  const { emailDigestId, editionId } = use(params)
  const searchParams = useSearchParams()
  const isFirst = searchParams?.get('isFirst') === 'true'
  const { session, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !session.firebaseId) return

      try {
        const response = await api.get(`/api/workforce/enduring/email-digest/${emailDigestId}`)
        const result = response.data
        if (result.success && result.product) {
          setProduct(result.product)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [emailDigestId, authLoading, session.firebaseId])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session.firebaseId) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce/enduring/email-digest" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/workforce/enduring/email-digest/${emailDigestId}`}
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
        >
          ← Back to Series
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          {isFirst && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-green-900 mb-1">Series Created Successfully!</h3>
                  <p className="text-sm text-green-800">
                    Now let's create your first edition of{' '}
                    <strong>"{product?.title || 'this series'}"</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isFirst ? 'Create First Edition' : 'Curate Edition'}
          </h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
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
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">🚧 Curation UI Coming Soon</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  This is where you'll select which company events, campaigns, trainings, and other content to
                  include in this edition.
                </p>
                <p className="text-sm text-yellow-700">
                  For now, you can go back to the series page and manually generate editions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/workforce/enduring/email-digest/${emailDigestId}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Series Page
            </Link>
            <Link
              href="/workforce/enduring/email-digest"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back to All Series
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
