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
  const [confidence, setConfidence] = useState<number | null>(null)

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
        setSuggestedType(response.data.suggestedType)
        setConfidence(response.data.confidence)
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
    if (!suggestedType || !rawText.trim()) return

    // For now, only handle "training"
    if (suggestedType !== 'training') {
      alert(`Type "${suggestedType}" is coming soon. Only "training" is supported.`)
      return
    }

    setLoading(true)
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workstuff/ingest/create-training', {
        rawText,
      })

      if (response.data.success) {
        // Redirect to training ingest page
        router.push(`/mycompany/workforcestuff/training/ingest/${response.data.trainingId}`)
      } else {
        alert('Failed to create training: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('Failed to create training')
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Suggested Type: <span className="capitalize">{suggestedType}</span>
                  </h3>
                  {confidence && (
                    <p className="text-sm text-gray-600 mt-1">
                      Confidence: {Math.round(confidence * 100)}%
                    </p>
                  )}
                </div>
              </div>

              {suggestedType === 'training' ? (
                <button
                  onClick={handleConfirmType}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Training...
                    </>
                  ) : (
                    <>
                      Confirm & Create Training
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="text-sm text-gray-600">
                  Type "{suggestedType}" is coming soon. Only "training" is currently supported.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
