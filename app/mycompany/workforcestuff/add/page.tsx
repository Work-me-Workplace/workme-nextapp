'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'

export default function AddWorkforceStuffPage() {
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    type: string
    confidence: number
    explanation: string
    redirectTo: string
  } | null>(null)

  async function handleAdd() {
    if (!rawText.trim()) {
      setError('Please paste some content first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await api.post('/api/workforcestuff/add', {
        rawText: rawText.trim(),
      })

      if (response.data.success) {
        setResult({
          type: response.data.type,
          confidence: response.data.confidence,
          explanation: response.data.explanation,
          redirectTo: response.data.redirectTo,
        })

        // Auto-redirect after 2 seconds
        setTimeout(() => {
          router.push(response.data.redirectTo)
        }, 2000)
      } else {
        setError(response.data.error || 'Failed to add item')
      }
    } catch (err: any) {
      console.error('Add error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to add item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/mycompany/workforcestuff"
            className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
          >
            ← Back to Workforce Stuff
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Add Workforce Item</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Paste your content and AI will automatically identify the type and structure it for you
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {!result ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Content
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste any workforce communication content here... events, training announcements, benefits info, campaigns, etc."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  AI will automatically detect if this is an event, training, campaign, benefits, or other type
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleAdd}
                  disabled={!rawText.trim() || loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Add Item
                    </>
                  )}
                </button>
                <Link
                  href="/mycompany/workforcestuff"
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Added Successfully!</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Detected Type: <span className="capitalize">{result.type.replace('_', ' ')}</span>
                </p>
                <p className="text-xs text-blue-700">
                  Confidence: {Math.round(result.confidence * 100)}% • {result.explanation}
                </p>
              </div>
              <p className="text-gray-600 mb-4">Redirecting you to the item...</p>
              <Link
                href={result.redirectTo}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                View Item →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Paste any workforce communication content</li>
            <li>• AI automatically identifies the type (event, training, campaign, etc.)</li>
            <li>• AI extracts and structures all relevant information</li>
            <li>• Item is created and ready to use</li>
          </ul>
        </div>
      </div>
    </div>
  )
}




