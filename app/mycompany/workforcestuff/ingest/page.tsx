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
            <div className="mt-4 flex gap-4">
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
                onClick={handleSupremeParse}
                disabled={!rawBlob.trim() || loading || !sourceType}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  Parse {sourceType === 'ntk' ? 'NTK' : 'Content'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <div className="mt-4">
              <button
                onClick={async () => {
                  if (!rawBlob.trim() || !workMeId || !sourceType) return
                  setLoading(true)
                  try {
                    const { default: api } = await import('@/lib/api')
                    const response = await api.post('/api/workstuff/split', { rawBlob })
                    if (response.data.success) {
                      router.push('/mycompany/workforcestuff/mapper')
                    } else {
                      alert('Failed to split: ' + (response.data.error || 'Unknown error'))
                    }
                  } catch (error) {
                    console.error('Split error:', error)
                    alert('Failed to split content')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={!rawBlob.trim() || loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Splitting...
                  </>
                ) : (
                  <>
                    Split into Sections →
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* STEP 2: Proposed */}
        {step === 'proposed' && proposed && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Detected: {proposed.type}</span>
                <span className="text-xs text-gray-500">({Math.round(proposed.confidence * 100)}% confidence)</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Proposed {proposed.type.charAt(0).toUpperCase() + proposed.type.slice(1)}: {proposed.extractedData.title || 'Untitled'}
              </h2>
              {proposed.reasoning && (
                <p className="text-sm text-gray-600 mb-4">{proposed.reasoning}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Proposed Fields:</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(proposed.extractedData, null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('input')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Edit First
              </button>
              <button
                onClick={() => {
                  setStep('source')
                  setSourceType(null)
                  setRawBlob('')
                  setProposed(null)
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Start Over
              </button>
              <button
                onClick={handleConfirmProposed}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    Confirm + Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Temp Workspace */}
        {step === 'workspace' && parsedData && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🧪 Workforce Parser Workspace</h2>
              <p className="text-gray-600">
                Parsed Model: <span className="font-semibold">{parsedData.type}</span> (verified)
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps:</h3>
              <div className="space-y-3">
                {Object.entries(parsedData.fieldGroups).map(([group, status]) => (
                  <div
                    key={group}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      status.status === 'completed'
                        ? 'border-green-200 bg-green-50'
                        : pendingGroups.includes(group)
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {status.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
                      )}
                      <span className="font-medium text-gray-900 capitalize">
                        {group === 'core' ? 'Core Info' : group}
                      </span>
                    </div>
                    {status.status === 'completed' ? (
                      <span className="text-sm text-green-600">✓ Completed</span>
                    ) : (
                      <button
                        onClick={() => {
                          // TODO: Open field group editor
                          alert(`Edit ${group} fields`)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Fill in →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <button
                onClick={() => {
                  setStep('source')
                  setSourceType(null)
                  setRawBlob('')
                  setProposed(null)
                  setParsedData(null)
                  setPendingGroups([])
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Start Over
              </button>
              <div className="flex gap-4 ml-auto">
                <Link
                  href="/mycompany/workforcestuff/mapper"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  Use Section Mapper →
                </Link>
                <button
                  onClick={handlePublish}
                  disabled={loading || pendingGroups.length > 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish to Workforce Stuff'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

