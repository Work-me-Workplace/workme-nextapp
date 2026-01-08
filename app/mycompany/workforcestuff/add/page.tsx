'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { getIdToken } from '@/lib/firebase/getIdToken'

// Helper function to format type names for display
function formatTypeName(type: string | null | undefined): string {
  if (!type) return 'unknown'
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function AddWorkforceStuffPage() {
  const router = useRouter()
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input')
  const [inference, setInference] = useState<{
    type: string
    confidence: number
    explanation: string
  } | null>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const [result, setResult] = useState<{
    type: string
    confidence: number
    explanation: string
    redirectTo: string
  } | null>(null)

  async function handleInfer() {
    if (!rawText.trim()) {
      setError('Please paste some content first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get Firebase token for authentication
      const token = await getIdToken()
      if (!token) {
        setError('Not authenticated. Please sign in.')
        setLoading(false)
        return
      }

      // Step 1: Infer type only (no parsing yet)
      const res = await fetch('/api/workforcestuff/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rawText: rawText.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Request failed')
      }

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to infer type')
        return
      }

      const inferred = data.inference
      if (!inferred || !inferred.type) {
        setError('Invalid response from server')
        return
      }

      // Ensure we have a valid type
      const inferredType = inferred.type
      setInference(inferred)
      setSelectedType(inferredType) // Set selected type to match AI inference
      setStep('confirm')
    } catch (err: any) {
      console.error('Infer error:', err)
      setError(err.message || 'Failed to infer type')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmAndSave() {
    if (!selectedType) {
      setError('Please select a type')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get Firebase token for authentication
      const token = await getIdToken()
      if (!token) {
        setError('Not authenticated. Please sign in.')
        setLoading(false)
        return
      }

      // Step 2: Save to database (modular ingest pattern)
      // The save endpoint will:
      // 1. Create CompanyX with ingest snapshot
      // 2. Parse the content (calls the parser)
      // 3. Update the record with parsed data
      const res = await fetch('/api/workforcestuff/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedType,
          rawText: rawText.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Request failed')
      }

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to save item')
        return
      }

      // Verify response structure
      if (!data.redirectTo || typeof data.redirectTo !== 'string') {
        console.error('Save response missing redirectTo:', data)
        setError('Server response missing redirect path')
        return
      }

      setResult({
        type: selectedType,
        confidence: inference?.confidence || 0,
        explanation: inference?.explanation || '',
        redirectTo: data.redirectTo,
      })
      setStep('success')

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push(data.redirectTo)
      }, 2000)
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save item')
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
          {step === 'input' && (
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
                  onClick={handleInfer}
                  disabled={!rawText.trim() || loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Analyze Content
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
          )}

          {step === 'confirm' && inference && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Type</h2>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>AI detected:</strong> {formatTypeName(inference.type)} (Confidence: {Math.round((inference.confidence || 0) * 100)}%)
                  </p>
                  <p className="text-sm text-gray-600 italic">{inference.explanation || 'No explanation provided'}</p>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="training">Training</option>
                  <option value="career">Career Opportunity</option>
                  <option value="event">Event</option>
                  <option value="leader_engagement">Leader Engagement</option>
                  <option value="campaign">Campaign</option>
                  <option value="impact_event">Impact Event</option>
                  <option value="community">Community Engagement</option>
                  <option value="benefits">Benefits</option>
                  <option value="employee_cause">Employee Cause</option>
                </select>
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
                  onClick={() => {
                    setStep('input')
                    setInference(null)
                    setSelectedType('')
                    setError(null)
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  disabled={!selectedType || loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Parsing & Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Confirm & Add Item
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'success' && result && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Added Successfully!</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Detected Type: {formatTypeName(result.type)}
                </p>
                <p className="text-xs text-blue-700">
                  Confidence: {Math.round((result.confidence || 0) * 100)}% • {result.explanation || 'No explanation provided'}
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




