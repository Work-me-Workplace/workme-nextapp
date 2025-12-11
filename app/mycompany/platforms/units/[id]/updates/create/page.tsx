'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { FileText, ArrowLeft, Wand2, Loader2, CheckCircle } from 'lucide-react'

interface ParsedUpdate {
  statusUpdate: string | null
  percentComplete: number | null
  industrialBaseNote: string | null
  scheduleNote: string | null
  leadershipQuote: string | null
  milestoneType: string | null
  milestoneDate: string | null
  keelLaidDate: string | null
  seaTrialsStartDate: string | null
  deliveryDate: string | null
  commissioningDate: string | null
}

export default function CreateUnitUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: unitId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [rawText, setRawText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [parsedUpdate, setParsedUpdate] = useState<ParsedUpdate | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
    }
  }, [router])

  async function handleParse() {
    if (!rawText.trim()) {
      alert('Please paste some text to parse')
      return
    }

    try {
      setParsing(true)
      // Use AI to parse the update - this would call a unit-specific parsing endpoint
      // For now, we'll create a simplified version
      // In production, this would call an AI service to extract structured data
      
      // Simulated parsing result - replace with actual AI call
      const result: ParsedUpdate = {
        statusUpdate: null,
        percentComplete: null,
        industrialBaseNote: null,
        scheduleNote: null,
        leadershipQuote: null,
        milestoneType: null,
        milestoneDate: null,
        keelLaidDate: null,
        seaTrialsStartDate: null,
        deliveryDate: null,
        commissioningDate: null,
      }
      
      setParsedUpdate(result)
    } catch (error: any) {
      console.error('Failed to parse:', error)
      alert('Failed to parse: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit() {
    if (!rawText.trim()) {
      alert('Please paste some text')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/api/company/products/platform/unit/update/create', {
        platformUnitId: unitId,
        rawText,
        sourceUrl: sourceUrl || null,
      })

      if (response.data.success) {
        router.push(`/mycompany/platforms/units/${unitId}`)
      } else {
        alert('Failed to create update: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create update:', error)
      alert('Failed to create update: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href={`/mycompany/platforms/units/${unitId}`}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Unit
            </Link>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Add Unit Update</h1>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Source URL (optional)
                  </label>
                  <input
                    type="url"
                    id="sourceUrl"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                    Paste Article or Release Text
                  </label>
                  <textarea
                    id="rawText"
                    rows={12}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Paste press release, article, or any text about this unit..."
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleParse}
                    disabled={parsing || !rawText.trim()}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {parsing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Parse with AI
                      </>
                    )}
                  </button>
                </div>

                {parsedUpdate && (
                  <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parsed Output</h3>
                    <div className="space-y-3 text-sm">
                      {parsedUpdate.statusUpdate && (
                        <div>
                          <span className="font-medium">Status Update:</span> {parsedUpdate.statusUpdate}
                        </div>
                      )}
                      {parsedUpdate.percentComplete !== null && (
                        <div>
                          <span className="font-medium">Percent Complete:</span> {parsedUpdate.percentComplete}%
                        </div>
                      )}
                      {parsedUpdate.industrialBaseNote && (
                        <div>
                          <span className="font-medium">Industrial Base Note:</span> {parsedUpdate.industrialBaseNote}
                        </div>
                      )}
                      {parsedUpdate.scheduleNote && (
                        <div>
                          <span className="font-medium">Schedule Note:</span> {parsedUpdate.scheduleNote}
                        </div>
                      )}
                      {parsedUpdate.leadershipQuote && (
                        <div>
                          <span className="font-medium">Leadership Quote:</span> "{parsedUpdate.leadershipQuote}"
                        </div>
                      )}
                      {parsedUpdate.milestoneType && (
                        <div>
                          <span className="font-medium">Milestone Detected:</span> {parsedUpdate.milestoneType}
                          {parsedUpdate.milestoneDate && ` on ${parsedUpdate.milestoneDate}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Link
                    href={`/mycompany/platforms/units/${unitId}`}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !rawText.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Save Update
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
