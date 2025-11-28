'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { ArrowRight, Loader2 } from 'lucide-react'

type SourceType = 'ntk' | 'email' | 'previous_workforce_comms' | 'previous_output' | 'other'

export default function WorkforceStuffIngestPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [sourceType, setSourceType] = useState<SourceType | null>(null)
  const [rawBlob, setRawBlob] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'source' | 'input'>('source')

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Workforce Stuff Ingestion</h1>
          <p className="text-gray-600 mt-2">Choose your source and let AI parse it into structured workforce items</p>
        </div>

        {/* STEP 1: Source Selection */}
        {step === 'source' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 1: Choose Source Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSourceType('ntk')
                  setStep('input')
                }}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">NTK (Formatted)</h3>
                </div>
                <p className="text-sm text-gray-600">Structured NTK content with formatted sections</p>
              </button>

              <button
                onClick={() => {
                  setSourceType('email')
                  setStep('input')
                }}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📧</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                </div>
                <p className="text-sm text-gray-600">Email content or forwarded messages</p>
              </button>

              <button
                onClick={() => {
                  setSourceType('previous_workforce_comms')
                  setStep('input')
                }}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Previous Workforce Comms</h3>
                </div>
                <p className="text-sm text-gray-600">Copy from existing workforce communications</p>
              </button>

              <button
                onClick={() => {
                  setSourceType('previous_output')
                  setStep('input')
                }}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Previous Output</h3>
                </div>
                <p className="text-sm text-gray-600">Copy from previous work outputs or products</p>
              </button>

              <button
                onClick={() => {
                  setSourceType('other')
                  setStep('input')
                }}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left md:col-span-2"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Other / Raw Text</h3>
                </div>
                <p className="text-sm text-gray-600">Any other text content or unstructured data</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Input */}
        {step === 'input' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Step 2: Paste {sourceType === 'ntk' ? 'NTK' : sourceType === 'email' ? 'Email' : 'Content'}
              </h2>
              <button
                onClick={() => {
                  setStep('source')
                  setSourceType(null)
                  setRawBlob('')
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Change Source
              </button>
            </div>
            {sourceType === 'ntk' && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>NTK Format:</strong> Paste structured NTK content with sections, items, and formatting. The parser will recognize NTK structure and extract items accordingly.
                </p>
              </div>
            )}
            <textarea
              value={rawBlob}
              onChange={(e) => setRawBlob(e.target.value)}
              placeholder={
                sourceType === 'ntk'
                  ? 'Paste your NTK formatted content here...'
                  : sourceType === 'email'
                  ? 'Paste email content here...'
                  : 'Paste your workforce communication content here...'
              }
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setStep('source')
                  setSourceType(null)
                  setRawBlob('')
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  if (!rawBlob.trim() || !workMeId) return
                  setLoading(true)
                  try {
                    const { default: api } = await import('@/lib/api')
                    const response = await api.post('/api/workstuff/ingest/infer', {
                      blob: rawBlob,
                    })
                    if (response.data.success) {
                      // Redirect to mapper
                      router.push('/mycompany/workforcestuff/mapper')
                    } else {
                      alert('Failed to infer sections: ' + (response.data.error || 'Unknown error'))
                    }
                  } catch (error) {
                    console.error('Infer error:', error)
                    alert('Failed to infer sections')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={!rawBlob.trim() || loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Inferring Sections...
                  </>
                ) : (
                  <>
                    Infer Sections
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
