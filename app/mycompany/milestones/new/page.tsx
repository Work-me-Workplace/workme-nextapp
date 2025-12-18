'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { FileText, Sparkles, Plus, Loader2, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

type InputMethod = 'url' | 'text'

export default function NewMilestonePage() {
  const router = useRouter()
  const [method, setMethod] = useState<'manual' | 'previous' | 'ai' | null>(null)
  
  // AI generation state
  const [inputMethod, setInputMethod] = useState<InputMethod>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'input' | 'parsing' | 'complete'>('input')
  const [error, setError] = useState<string | null>(null)
  const [createdMilestone, setCreatedMilestone] = useState<any>(null)

  const handleAIGenerate = async () => {
    setError(null)
    setLoading(true)
    setStep('parsing')

    try {
      // Step 1: Create CompanyNewsArtifact
      const artifactResponse = await api.post('/api/utils/news-artifact/create', {
        sourceUrl: inputMethod === 'url' ? url : null,
        rawText: inputMethod === 'text' ? text : `Article from ${url}`,
      })

      if (!artifactResponse.data.success) {
        throw new Error(artifactResponse.data.error || 'Failed to create news artifact')
      }

      const artifactId = artifactResponse.data.data.id

      // Step 2: Upsert CompanyMilestone from the artifact
      const milestoneResponse = await api.post('/api/company/milestones/upsert', {
        newsArtifactId: artifactId,
      })

      if (!milestoneResponse.data.success) {
        throw new Error(milestoneResponse.data.error || 'Failed to create milestone')
      }

      setCreatedMilestone(milestoneResponse.data.milestone)
      setStep('complete')
    } catch (err: any) {
      console.error('Error generating milestone:', err)
      setError(err.message || 'Failed to generate milestone')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = inputMethod === 'url' ? url.trim().length > 0 : text.trim().length > 0

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
            <Link href="/mycompany/milestones" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Milestones
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Add Company Milestone</h1>
              <p className="text-gray-600 mt-2">Choose how you want to add this milestone</p>
            </div>

            {!method ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setMethod('manual')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <FileText className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Manually</h3>
                  <p className="text-sm text-gray-600">Enter milestone details yourself</p>
                </button>

                <button
                  onClick={() => setMethod('previous')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <Plus className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pull Previous Milestone</h3>
                  <p className="text-sm text-gray-600">Reuse a previous milestone as template</p>
                </button>

                <button
                  onClick={() => setMethod('ai')}
                  className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
                >
                  <Sparkles className="h-8 w-8 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate w/ AI</h3>
                  <p className="text-sm text-gray-600">Provide URL or paste content to generate</p>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setMethod(null)
                      setStep('input')
                      setError(null)
                      setCreatedMilestone(null)
                      setUrl('')
                      setText('')
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ← Choose Different Method
                  </button>
                </div>
                {method === 'manual' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Entry</h2>
                    <p className="text-gray-600">Manual entry form coming soon...</p>
                  </div>
                )}
                {method === 'previous' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Pull Previous Milestone</h2>
                    <p className="text-gray-600">Previous milestone selector coming soon...</p>
                  </div>
                )}
                {method === 'ai' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate with AI</h2>
                    
                    {step === 'input' && (
                      <>
                        {/* Input Method Toggle */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            How would you like to provide the content?
                          </label>
                          <div className="flex gap-4">
                            <button
                              onClick={() => setInputMethod('url')}
                              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                                inputMethod === 'url'
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-semibold">URL</div>
                              <div className="text-xs mt-1">Paste article link</div>
                            </button>
                            <button
                              onClick={() => setInputMethod('text')}
                              className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                                inputMethod === 'text'
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-semibold">Text</div>
                              <div className="text-xs mt-1">Paste article content</div>
                            </button>
                          </div>
                        </div>

                        {/* Input Field */}
                        {inputMethod === 'url' ? (
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Article URL
                            </label>
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => setUrl(e.target.value)}
                              placeholder="https://news.usni.org/..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Paste a link to a press release, news article, or announcement
                            </p>
                          </div>
                        ) : (
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Article Text
                            </label>
                            <textarea
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              placeholder="Paste the full article or press release text here..."
                              rows={12}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              AI will extract milestone information from this text
                            </p>
                          </div>
                        )}

                        {/* Error Display */}
                        {error && (
                          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={handleAIGenerate}
                            disabled={!canSubmit || loading}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5" />
                                Generate Milestone
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}

                    {step === 'parsing' && (
                      <div className="text-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Parsing Article...
                        </h3>
                        <p className="text-gray-600">
                          AI is extracting milestone information from the content
                        </p>
                      </div>
                    )}

                    {step === 'complete' && createdMilestone && (
                      <div className="py-8">
                        <div className="text-center mb-8">
                          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Milestone Created!
                          </h3>
                          <p className="text-gray-600">
                            Your milestone has been successfully generated and saved
                          </p>
                        </div>

                        {/* Milestone Preview */}
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                          <div className="mb-4">
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {createdMilestone.category || 'MILESTONE'}
                            </span>
                            {createdMilestone.milestoneType && (
                              <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {createdMilestone.milestoneType}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-3">
                            {createdMilestone.title}
                          </h4>
                          {createdMilestone.description && (
                            <p className="text-gray-700 mb-4">{createdMilestone.description}</p>
                          )}
                          {createdMilestone.date && (
                            <p className="text-sm text-gray-600">
                              📅 {new Date(createdMilestone.date).toLocaleDateString()}
                            </p>
                          )}
                          {createdMilestone.newsArtifact && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">Source</p>
                              <p className="text-sm text-gray-700 font-medium">
                                {createdMilestone.newsArtifact.sourceName || 'News Article'}
                              </p>
                              {createdMilestone.newsArtifact.sourceUrl && (
                                <a
                                  href={createdMilestone.newsArtifact.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  View original →
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                          <button
                            onClick={() => router.push(`/mycompany/milestones/${createdMilestone.id}`)}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                          >
                            View Milestone
                          </button>
                          <button
                            onClick={() => {
                              setStep('input')
                              setCreatedMilestone(null)
                              setUrl('')
                              setText('')
                            }}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                          >
                            Create Another
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

