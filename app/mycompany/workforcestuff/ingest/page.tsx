'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { CheckCircle, Edit, ArrowRight, Loader2 } from 'lucide-react'

interface ProposedData {
  type: string
  confidence: number
  reasoning: string
  extractedData: any
  metadata: any
}

interface ParsedData {
  type: string
  data: any
  fieldGroups: Record<string, { status: string; completedAt?: string; data?: any }>
}

export default function WorkforceStuffIngestPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [rawBlob, setRawBlob] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'input' | 'proposed' | 'parsing' | 'workspace'>('input')
  const [proposed, setProposed] = useState<ProposedData | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [pendingGroups, setPendingGroups] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        checkExistingWorkspace(id)
      }
    }
  }, [router])

  async function checkExistingWorkspace(id: string) {
    try {
      const { default: api } = await import('@/lib/api')
      const response = await api.get('/api/workforce-stuff/ingest/progressive')
      if (response.data.success && response.data.parsedData) {
        setParsedData(response.data.parsedData)
        setPendingGroups(response.data.pending || [])
        setStep('workspace')
      }
    } catch (error) {
      console.error('Failed to check workspace:', error)
    }
  }

  async function handleSupremeParse() {
    if (!rawBlob.trim() || !workMeId) return

    setLoading(true)
    try {
      // Use api client which automatically adds Firebase token
      const { default: api } = await import('@/lib/api')
      const response = await api.post('/api/workforce-stuff/ingest/supreme', {
        rawBlob,
      })

      if (response.data.success) {
        setProposed(response.data.proposed)
        setStep('proposed')
      } else {
        alert('Failed to parse: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Parse error:', error)
      alert('Failed to parse content')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmProposed() {
    if (!proposed || !workMeId) return

    setLoading(true)
    try {
      // Initialize parsed data structure
      const initialParsed: ParsedData = {
        type: proposed.type,
        data: proposed.extractedData,
        fieldGroups: {
          core: { status: 'pending' },
          scheduling: { status: 'pending' },
          audience: { status: 'pending' },
          metadata: { status: 'pending' },
          attachments: { status: 'pending' },
        },
      }

      // Store initial pending groups
      const allGroups = ['core', 'scheduling', 'audience', 'metadata', 'attachments']
      setPendingGroups(allGroups)
      setParsedData(initialParsed)
      setStep('workspace')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to initialize workspace')
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    if (!parsedData || !workMeId) return

    if (confirm('Publish this to Workforce Stuff? This will finalize the item.')) {
      setLoading(true)
      try {
        const { default: api } = await import('@/lib/api')
        const response = await api.post('/api/workforce-stuff/ingest/publish', {})
        
        if (response.data.success) {
          alert('Published successfully!')
          router.push(`/mycompany/workforcestuff/${response.data.companyX.id}`)
        } else {
          alert('Failed to publish: ' + (response.data.error || 'Unknown error'))
        }
      } catch (error) {
        console.error('Publish error:', error)
        alert('Failed to publish')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Workforce Stuff
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Workforce Stuff Ingestion</h1>
          <p className="text-gray-600 mt-2">Paste content and let AI parse it into structured workforce items</p>
        </div>

        {/* STEP 1: Input */}
        {step === 'input' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Paste Content</h2>
            <textarea
              value={rawBlob}
              onChange={(e) => setRawBlob(e.target.value)}
              placeholder="Paste your workforce communication content here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSupremeParse}
              disabled={!rawBlob.trim() || loading}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  Parse Content
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
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
                onClick={() => setStep('input')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Start Over
              </button>
              <button
                onClick={handlePublish}
                disabled={loading || pendingGroups.length > 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
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
        )}
      </div>
    </div>
  )
}

