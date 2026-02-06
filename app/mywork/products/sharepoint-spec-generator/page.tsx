'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Share2, ArrowLeft, FileText, Download, Copy, Sparkles, Plus, X } from 'lucide-react'

type Mode = 'ai' | 'manual'

interface Page {
  title: string
  description: string
}

interface Spec {
  name: string
  description: string
  rawJson: string
}

export default function SharePointSpecGeneratorPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('ai')
  const [loading, setLoading] = useState(false)
  const [spec, setSpec] = useState<Spec | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Form data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rawText, setRawText] = useState('')
  const [pages, setPages] = useState<Page[]>([{ title: '', description: '' }])

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

  function addPage() {
    setPages([...pages, { title: '', description: '' }])
  }

  function removePage(index: number) {
    if (pages.length > 1) {
      setPages(pages.filter((_, i) => i !== index))
    }
  }

  function updatePage(index: number, field: 'title' | 'description', value: string) {
    const updated = [...pages]
    updated[index][field] = value
    setPages(updated)
  }

  async function generateSpec() {
    if (!name || !description) {
      alert('Name and description are required')
      return
    }

    if (mode === 'ai' && !rawText.trim()) {
      alert('Please enter raw text for AI generation')
      return
    }

    if (mode === 'manual') {
      const hasEmptyPages = pages.some(p => !p.title.trim() || !p.description.trim())
      if (hasEmptyPages) {
        alert('Please fill in all page titles and descriptions')
        return
      }
    }

    try {
      setLoading(true)
      const response = await api.post('/api/mywork/sharepoint-spec/generate', {
        mode,
        name,
        description,
        rawText: mode === 'ai' ? rawText : undefined,
        pages: mode === 'manual' ? pages : undefined,
      })

      if (response.data.success) {
        setSpec(response.data.spec)
      } else {
        alert('Failed to generate spec: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to generate spec:', error)
      alert('Failed to generate spec: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    if (!spec) return
    navigator.clipboard.writeText(spec.rawJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadSpec() {
    if (!spec) return
    const blob = new Blob([spec.rawJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sharepoint-spec-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function resetForm() {
    setName('')
    setDescription('')
    setRawText('')
    setPages([{ title: '', description: '' }])
    setSpec(null)
  }

  function formatJsonDisplay(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString)
      return parsed
    } catch {
      return jsonString
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
              <Link href="/mywork" className="flex items-center space-x-2">
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
              href="/mywork/products"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Products
            </Link>

            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="flex items-center mb-6">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">SharePoint Spec Generator</h1>
              </div>

              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose your input method:
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setMode('ai')
                      resetForm()
                    }}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 font-medium transition ${
                      mode === 'ai'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Sparkles className="h-5 w-5 inline mr-2" />
                    Build with AI
                  </button>
                  <button
                    onClick={() => {
                      setMode('manual')
                      resetForm()
                    }}
                    className={`flex-1 px-6 py-3 rounded-lg border-2 font-medium transition ${
                      mode === 'manual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <FileText className="h-5 w-5 inline mr-2" />
                    Manual Entry
                  </button>
                </div>
              </div>

              {/* Common Fields */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name/Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Q4 Company Updates Site"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Overall description of the SharePoint build..."
                  />
                </div>

                {/* AI Mode */}
                {mode === 'ai' && (
                  <div>
                    <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                      Raw Text Input <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rawText"
                      required
                      rows={8}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder='Example: "This is a SharePoint build for main page and new associated pages. We need a homepage with company updates, a products page showcasing our new offerings, and a contact page with team information."'
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Describe your SharePoint build in natural language. AI will infer the pages and structure.
                    </p>
                  </div>
                )}

                {/* Manual Mode */}
                {mode === 'manual' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Pages <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addPage}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Page
                      </button>
                    </div>
                    <div className="space-y-4">
                      {pages.map((page, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Page {index + 1}</span>
                            {pages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePage(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              required
                              value={page.title}
                              onChange={(e) => updatePage(index, 'title', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Page title..."
                            />
                            <textarea
                              required
                              rows={3}
                              value={page.description}
                              onChange={(e) => updatePage(index, 'description', e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Page description..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={generateSpec}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate Spec'}
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Spec Display */}
            {spec && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Generated Specification</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={downloadSpec}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Formatted Display */}
                <div className="mb-6 bg-gray-50 rounded-lg p-6">
                  {(() => {
                    const parsed = formatJsonDisplay(spec.rawJson)
                    if (typeof parsed === 'string') {
                      return <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{parsed}</pre>
                    }
                    return (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{parsed.title}</h3>
                          <p className="text-gray-700">{parsed.executiveSummary}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Content Pages:</h4>
                          <div className="space-y-3">
                            {parsed.contentPages?.map((page: any, index: number) => (
                              <div key={index} className="border-l-4 border-blue-500 pl-4">
                                <h5 className="font-medium text-gray-900">{page.title}</h5>
                                <p className="text-sm text-gray-600 mt-1">{page.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Conclusion:</h4>
                          <p className="text-gray-700">{parsed.conclusion}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Raw JSON */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Raw JSON:</h3>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono">
                      {spec.rawJson}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
