'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useState, useEffect } from 'react'
import { getWorkforceCommsDraft } from '@/lib/actions/workforce-comms'

export default function GenerateEditionPage({ params }: { params: Promise<{ productId: string; draftId: string }> }) {
  const router = useRouter()
  const { productId, draftId } = use(params)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState<any>(null)
  const [edition, setEdition] = useState<any>(null)

  useEffect(() => {
    async function fetchDraft() {
      const result = await getWorkforceCommsDraft(draftId)
      if (result.success && result.draft) {
        setDraft(result.draft)
      }
    }
    fetchDraft()
  }, [draftId])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/workforce-comms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, productId }),
      })

      const result = await response.json()
      if (result.success && result.edition) {
        setEdition(result.edition)
      } else {
        alert('Failed to generate edition: ' + (result.error || 'Unknown error'))
        setGenerating(false)
      }
    } catch (error) {
      console.error('Error generating edition:', error)
      alert('Failed to generate edition')
      setGenerating(false)
    }
  }

  const handleSave = () => {
    router.push(`/workforce-comms/${productId}/editions/${edition.editionId}`)
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        <Link href={`/workforce-comms/${productId}/drafts/${draftId}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Draft
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Edition</h2>

          {!edition ? (
            <div>
              <p className="text-gray-600 mb-6">
                This will use AI to generate a new edition based on your draft.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold"
              >
                {generating ? 'Generating...' : 'Generate Edition'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Edition generated successfully!</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <p className="font-medium">{edition.subject}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body</label>
                <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 whitespace-pre-wrap">
                  {edition.body}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Save & Review
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

