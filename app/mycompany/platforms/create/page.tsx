'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Ship, ArrowLeft, Wand2, FileText, Loader2, CheckCircle } from 'lucide-react'

type Tab = 'manual' | 'ai'

interface PlatformFormData {
  name: string
  category: string
  programCode: string
  description: string
  whySpecial: string
  payloadNotes: string
  intendedTotalUnits: string
  knownShipsInClass: string
}

interface AISummary {
  overview: string
  keyCapabilities: string[]
  knownBoats: string[]
  challenges: string[]
  suggestedFields: {
    name?: string
    category?: string
    programCode?: string
    description?: string
    whySpecial?: string
    payloadNotes?: string
    intendedTotalUnits?: string
    knownShipsInClass?: string
  }
}

export default function CreatePlatformPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('manual')
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [formData, setFormData] = useState<PlatformFormData>({
    name: '',
    category: '',
    programCode: '',
    description: '',
    whySpecial: '',
    payloadNotes: '',
    intendedTotalUnits: '',
    knownShipsInClass: '',
  })

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

  async function handleAIParse(text: string) {
    if (!text.trim()) {
      alert('Please paste some text to parse')
      return
    }

    try {
      setParsing(true)
      const response = await api.post('/api/platform/ai-parse', { text })

      if (response.data.success && response.data.data) {
        const data = response.data.data
        // Generate AI summary from parsed data
        const summary: AISummary = {
          overview: data.platform.description || 'Platform information extracted from text.',
          keyCapabilities: data.platform.whySpecial ? [data.platform.whySpecial] : [],
          knownBoats: data.units.map((u: any) => u.hullNumber || u.name).filter(Boolean),
          challenges: [],
          suggestedFields: {
            name: data.platform.name,
            category: data.platform.category,
            programCode: data.platform.programCode,
            description: data.platform.description,
            whySpecial: data.platform.whySpecial,
            knownShipsInClass: data.units.map((u: any) => u.hullNumber).filter(Boolean).join(', '),
          },
        }
        setAiSummary(summary)
      } else {
        alert('Failed to parse: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to parse with AI:', error)
      alert('Failed to parse: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(false)
    }
  }

  function applyAISummary() {
    if (!aiSummary) return
    setFormData({
      ...formData,
      ...aiSummary.suggestedFields,
      knownShipsInClass: aiSummary.knownBoats.join(', '),
    })
    setActiveTab('manual')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.category) {
      alert('Name and category are required')
      return
    }

    try {
      setLoading(true)
      const payload = {
        name: formData.name,
        category: formData.category,
        programCode: formData.programCode || null,
        description: formData.description || null,
        whySpecial: formData.whySpecial || null,
        payloadNotes: formData.payloadNotes || null,
        intendedTotalUnits: formData.intendedTotalUnits ? parseInt(formData.intendedTotalUnits) : null,
        knownShipsInClass: formData.knownShipsInClass
          ? formData.knownShipsInClass.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      }

      const response = await api.post('/api/company/products/platform/create', payload)

      if (response.data.success) {
        router.push(`/mycompany/platforms/${response.data.product.id}`)
      } else {
        alert('Failed to create platform: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create platform:', error)
      alert('Failed to create platform: ' + (error.response?.data?.error || error.message))
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
              href="/mycompany/platforms"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Platforms
            </Link>

            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <Ship className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Create Platform</h1>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('manual')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'manual'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'ai'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Wand2 className="h-4 w-4 inline mr-2" />
                    AI Ingest
                  </button>
                </nav>
              </div>

              {/* Tab A — Manual Entry */}
              {activeTab === 'manual' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Columbia-class"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      <option value="Submarine">Submarine</option>
                      <option value="Surface Ship">Surface Ship</option>
                      <option value="Aviation">Aviation</option>
                      <option value="Digital">Digital</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="programCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Program Code
                    </label>
                    <input
                      type="text"
                      id="programCode"
                      value={formData.programCode}
                      onChange={(e) => setFormData({ ...formData, programCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., SSBN, SSN, DDG"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Platform description..."
                    />
                  </div>

                  <div>
                    <label htmlFor="whySpecial" className="block text-sm font-medium text-gray-700 mb-2">
                      Why Special
                    </label>
                    <textarea
                      id="whySpecial"
                      rows={3}
                      value={formData.whySpecial}
                      onChange={(e) => setFormData({ ...formData, whySpecial: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What makes this platform special..."
                    />
                  </div>

                  <div>
                    <label htmlFor="payloadNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      Payload Notes
                    </label>
                    <textarea
                      id="payloadNotes"
                      rows={3}
                      value={formData.payloadNotes}
                      onChange={(e) => setFormData({ ...formData, payloadNotes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., VPM adds 28 missiles"
                    />
                  </div>

                  <div>
                    <label htmlFor="intendedTotalUnits" className="block text-sm font-medium text-gray-700 mb-2">
                      Intended Total Units
                    </label>
                    <input
                      type="number"
                      id="intendedTotalUnits"
                      value={formData.intendedTotalUnits}
                      onChange={(e) => setFormData({ ...formData, intendedTotalUnits: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 12"
                    />
                  </div>

                  <div>
                    <label htmlFor="knownShipsInClass" className="block text-sm font-medium text-gray-700 mb-2">
                      Known Ships in Class
                    </label>
                    <input
                      type="text"
                      id="knownShipsInClass"
                      value={formData.knownShipsInClass}
                      onChange={(e) => setFormData({ ...formData, knownShipsInClass: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Comma-separated, e.g., SSN 804, SSN 805, SSN 806"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple ships with commas</p>
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <Link
                      href="/mycompany/platforms"
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Platform'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab B — AI Ingest */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="aiText" className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Article or Text
                    </label>
                    <textarea
                      id="aiText"
                      rows={12}
                      onChange={(e) => {
                        // Store text for parsing
                        const text = e.target.value
                        if (text.length > 100) {
                          // Auto-parse when text is substantial
                          // Or user can click button
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Paste any article, fact file, or Wikipedia entry about this platform..."
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        const textarea = document.getElementById('aiText') as HTMLTextAreaElement
                        if (textarea) {
                          handleAIParse(textarea.value)
                        }
                      }}
                      disabled={parsing}
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
                          Generate Summary
                        </>
                      )}
                    </button>
                  </div>

                  {aiSummary && (
                    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Summary</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Overview</h4>
                          <p className="text-sm text-gray-700">{aiSummary.overview}</p>
                        </div>

                        {aiSummary.keyCapabilities.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Key Capabilities</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {aiSummary.keyCapabilities.map((cap, idx) => (
                                <li key={idx}>{cap}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiSummary.knownBoats.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Known Boats</h4>
                            <p className="text-sm text-gray-700">{aiSummary.knownBoats.join(', ')}</p>
                          </div>
                        )}

                        {aiSummary.challenges.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Challenges / Industrial Base</h4>
                            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                              {aiSummary.challenges.map((challenge, idx) => (
                                <li key={idx}>{challenge}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-4 border-t border-blue-200">
                          <button
                            onClick={applyAISummary}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Apply Summary to Form
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
