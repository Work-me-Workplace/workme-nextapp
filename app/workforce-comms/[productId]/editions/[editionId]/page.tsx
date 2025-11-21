'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useState, useEffect } from 'react'
import { getWorkforceCommsEdition, markEditionAsSent } from '@/lib/actions/workforce-comms'

export default function EditionReviewPage({ params }: { params: Promise<{ productId: string; editionId: string }> }) {
  const router = useRouter()
  const { productId, editionId } = use(params)
  const [edition, setEdition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchEdition() {
      const result = await getWorkforceCommsEdition(editionId)
      if (result.success && result.edition) {
        setEdition(result.edition)
      }
      setLoading(false)
    }
    fetchEdition()
  }, [editionId])

  const handleMarkAsSent = async () => {
    if (!confirm('Mark this edition as sent? This will record the send date.')) {
      return
    }

    setSaving(true)
    try {
      const result = await markEditionAsSent(editionId)
      if (result.success && result.edition) {
        setEdition(result.edition)
        alert('Edition marked as sent!')
      } else {
        alert('Failed to mark as sent: ' + (result.error || 'Unknown error'))
        setSaving(false)
      }
    } catch (error) {
      console.error('Error marking as sent:', error)
      alert('Failed to mark as sent')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!edition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Edition not found</h2>
          <Link href={`/workforce-comms/${productId}`} className="text-blue-600 hover:underline">
            Back to Product
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/workforce-comms" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={`/workforce-comms/${productId}/editions`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Editions
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Edition</h2>
              <p className="text-gray-600">
                Created: {new Date(edition.createdAt).toLocaleString()}
              </p>
              {edition.sentAt && (
                <p className="text-green-600 font-medium mt-2">
                  Sent: {new Date(edition.sentAt).toLocaleString()}
                </p>
              )}
            </div>
            {!edition.sentAt && (
              <button
                onClick={handleMarkAsSent}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
              >
                {saving ? 'Saving...' : 'Mark as Sent'}
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <p className="font-medium text-lg">{edition.subject}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 whitespace-pre-wrap">
                {edition.body}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 mt-6 border-t">
            <Link
              href={`/workforce-comms/${productId}`}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Back to Product
            </Link>
            <Link
              href={`/workforce-comms/${productId}/drafts/new`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create New Draft from This Edition
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

