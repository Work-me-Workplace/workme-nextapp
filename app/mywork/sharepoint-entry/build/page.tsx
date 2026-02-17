'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { ArrowLeft, Copy, Download, Loader2, Sparkles } from 'lucide-react'

interface SharePointEntryDisplay {
  title: string
  when: string
  where: string
  category: string
  link: string
}

function BuildContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sourceId = searchParams.get('sourceId')
  const sourceType = searchParams.get('sourceType')
  const companyId = searchParams.get('companyId')

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formattingWithAi, setFormattingWithAi] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entry, setEntry] = useState<SharePointEntryDisplay | null>(null)
  const [promptText, setPromptText] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const load = async (formatWithAi = false) => {
    if (!sourceId || !sourceType) {
      setError('Missing sourceId or sourceType')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      if (formatWithAi) setFormattingWithAi(true)
      const res = await api.post('/api/mywork/sharepoint-entry/render', {
        sourceId,
        sourceType,
        formatWithAi: formatWithAi,
      })
      if (res.data.success) {
        setEntry(res.data.entry)
        setPromptText(res.data.promptText ?? '')
      } else {
        setError(res.data.error ?? 'Failed to render')
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to load')
    } finally {
      setLoading(false)
      setFormattingWithAi(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = getWorkMeIdFromStorage()
    if (!id) {
      router.push('/signin')
      return
    }
    setWorkMeId(id)
    load(false)
  }, [sourceId, sourceType])

  const copyPrompt = () => {
    if (!promptText) return
    navigator.clipboard.writeText(promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadJson = () => {
    if (!entry) return
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sharepoint-entry-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const productGenHref = sourceId
    ? `/mycompany/workforcestuff/${sourceId}/product-gen${companyId ? `?companyId=${companyId}` : ''}`
    : '/mycompany/workforcestuff'

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />
        <main className="flex-1">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href={productGenHref}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to product options
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">SharePoint Entry</h1>
            <p className="text-gray-600 mb-6">
              Rendered from your workforce item. Use this for SharePoint Events or NTK. Data comes from the database (no new model).
            </p>

            {loading && !entry && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading…
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
                {error}
              </div>
            )}

            {entry && (
              <>
                <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">SharePoint Events entry</h2>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Title</dt>
                      <dd className="text-gray-900">{entry.title}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">When</dt>
                      <dd className="text-gray-900">{entry.when || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Where</dt>
                      <dd className="text-gray-900">{entry.where || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Category</dt>
                      <dd className="text-gray-900">{entry.category}</dd>
                    </div>
                    {entry.link && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">Link</dt>
                        <dd>
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {entry.link}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => load(true)}
                      disabled={formattingWithAi}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                    >
                      {formattingWithAi ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Format &quot;When&quot; with AI
                    </button>
                  </div>
                </div>

                {promptText && (
                  <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Prompt-ready text</h2>
                    <p className="text-sm text-gray-500 mb-2">Copy and paste into SharePoint or your prompt.</p>
                    <pre className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap font-sans mb-4">
                      {promptText}
                    </pre>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={copyPrompt}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        <Copy className="h-4 w-4" />
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={downloadJson}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                      >
                        <Download className="h-4 w-4" />
                        Download JSON
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SharePointEntryBuildPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <BuildContent />
    </Suspense>
  )
}
