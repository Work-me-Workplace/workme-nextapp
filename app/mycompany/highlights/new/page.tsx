'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Sparkles, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

interface ParsedData {
  employee: {
    fullName: string
    title?: string | null
    email?: string | null
    unitRaw?: string | null
  }
  highlight: {
    citationText: string
    achievement?: string | null
    narrative?: string | null
    classification?: string | null
    awardName?: string | null
    awardingAgency?: string | null
    awardYear?: number | null
    supervisorQuote?: string | null
    photoUrl?: string | null
  }
}

export default function NewHighlightPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [rawText, setRawText] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

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

  async function handleExtract() {
    if (!rawText.trim()) {
      setError('Please enter citation text')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/company/highlights/ingest', {
        text: rawText.trim(),
        photoUrl: photoUrl.trim() || undefined,
      })

      if (response.data.success) {
        const highlight = response.data.highlight
        const employee = response.data.employee
        
        setParsedData({
          employee: {
            fullName: employee.fullName,
            title: employee.title,
            email: employee.email,
            unitRaw: employee.unitRaw || null,
          },
          highlight: {
            citationText: highlight.citationText,
            achievement: highlight.achievement,
            narrative: highlight.narrative,
            classification: highlight.classification,
            awardName: highlight.awardName,
            awardingAgency: highlight.awardingAgency,
            awardYear: highlight.awardYear,
            supervisorQuote: highlight.supervisorQuote,
            photoUrl: highlight.photoUrl,
          },
        })
        setHighlightId(highlight.id)
      } else {
        setError(response.data.error || 'Failed to extract highlight')
      }
    } catch (err: any) {
      console.error('Failed to extract highlight:', err)
      setError(err.response?.data?.error || err.message || 'Failed to extract highlight')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!parsedData || !highlightId) return

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/company/highlights/save', {
        highlightId,
        employee: parsedData.employee,
        highlight: parsedData.highlight,
      })

      if (response.data.success) {
        router.push(`/mycompany/highlights/${highlightId}`)
      } else {
        setError(response.data.error || 'Failed to save highlight')
      }
    } catch (err: any) {
      console.error('Failed to save highlight:', err)
      setError(err.response?.data?.error || err.message || 'Failed to save highlight')
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
              href="/mycompany/highlights"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Highlights
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center mb-6">
                <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
                <h1 className="text-3xl font-bold text-gray-900">Add Employee Highlight</h1>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                This uses AI to parse and structure award citations, highlights, and recognition writeups.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {!parsedData ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Award Citation or Highlight Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rawText"
                      rows={12}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Paste the full award citation, recognition text, or highlight writeup here..."
                    />
                  </div>

                  <div>
                    <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Photo URL (Optional)
                    </label>
                    <input
                      id="photoUrl"
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <Link
                      href="/mycompany/highlights"
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleExtract}
                      disabled={loading || !rawText.trim()}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Extract with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
                    <p className="font-medium">Review and edit the extracted data:</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Employee Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={parsedData.employee.fullName}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              employee: { ...parsedData.employee, fullName: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={parsedData.employee.title || ''}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              employee: { ...parsedData.employee, title: e.target.value || null }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                          <input
                            type="text"
                            value={parsedData.employee.unitRaw || ''}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              employee: { ...parsedData.employee, unitRaw: e.target.value || null }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="SEA 05, SEA08D1, etc."
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Award Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Award Name</label>
                          <input
                            type="text"
                            value={parsedData.highlight.awardName || ''}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              highlight: { ...parsedData.highlight, awardName: e.target.value || null }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Awarding Agency</label>
                          <input
                            type="text"
                            value={parsedData.highlight.awardingAgency || ''}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              highlight: { ...parsedData.highlight, awardingAgency: e.target.value || null }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                          <input
                            type="number"
                            value={parsedData.highlight.awardYear || ''}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              highlight: { ...parsedData.highlight, awardYear: e.target.value ? parseInt(e.target.value) : null }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
                          <input
                            type="text"
                            value={parsedData.highlight.classification || ''}
                            onChange={(e) => setParsedData({
                              ...parsedData,
                              highlight: { ...parsedData.highlight, classification: e.target.value || null }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Achievement Summary</label>
                    <textarea
                      rows={2}
                      value={parsedData.highlight.achievement || ''}
                      onChange={(e) => setParsedData({
                        ...parsedData,
                        highlight: { ...parsedData.highlight, achievement: e.target.value || null }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Citation Text</label>
                    <textarea
                      rows={6}
                      value={parsedData.highlight.citationText}
                      onChange={(e) => setParsedData({
                        ...parsedData,
                        highlight: { ...parsedData.highlight, citationText: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => setParsedData(null)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Highlight'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
