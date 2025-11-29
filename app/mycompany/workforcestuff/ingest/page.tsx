'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function WorkforceStuffIngestPage() {
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedType, setSuggestedType] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('training')

  async function handleInferType() {
    if (!rawText.trim()) {
      alert('Please paste some text first')
      return
    }

    setLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workstuff/ingest/type-infer', {
        blob: rawText,
      })

      if (response.data.success) {
        const suggested = response.data.suggestedType || 'training'
        setSuggestedType(suggested)
        setSelectedType(suggested) // Set selectedType to suggestedType initially
      } else {
        alert('Failed to infer type: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Infer error:', error)
      alert('Failed to infer type')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmType() {
    if (!selectedType || !rawText.trim()) return

    setLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workstuff/ingest/create-training', {
        rawText,
        selectedType,
      })

      if (response.data.success) {
        // Use redirectTo from response, or fallback to training route
        const redirectTo = response.data.redirectTo || `/mycompany/workforcestuff/training/ingest/${response.data.trainingId}`
        router.push(redirectTo)
      } else {
        alert('Failed to create: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Ingest Workforce Content</h1>
          <p className="text-gray-600 mt-2">Paste your content and we'll help you structure it</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Content
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your workforce communication content here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleInferType}
              disabled={!rawText.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Inferring Type...
                </>
              ) : (
                <>
                  Infer Type
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>

          {suggestedType && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Detected Type
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="training">Training</option>
                  <option value="event">Event</option>
                  <option value="notice">Notice</option>
                  <option value="task">Task</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                onClick={handleConfirmType}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Confirm & Create
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
