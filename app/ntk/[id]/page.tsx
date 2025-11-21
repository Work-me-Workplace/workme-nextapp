'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import NTKPreview from '@/components/ntk/NTKPreview'
import type { NTKStructure } from '@/lib/types/ntk'

interface NTKData {
  ntkId: string
  header: string
  poc: string
  summary: string
  sourceText?: string
  draftContent?: NTKStructure
  metadata?: {
    isCSV?: boolean
    generatedAt?: string
  }
  createdAt: string
  updatedAt: string
}

export default function NTKDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [ntkData, setNtkData] = useState<NTKData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadNTK = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get(`/api/ntk/${id}`)

        if (response.data.success && response.data.ntk) {
          setNtkData(response.data.ntk)
        } else {
          setError(response.data.error || 'Failed to load NTK')
        }
      } catch (err: any) {
        console.error('NTK load error:', err)
        setError(err.response?.data?.error || 'Failed to load NTK. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadNTK()
  }, [id])

  const handleSave = async () => {
    if (!ntkData) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await api.put(`/api/ntk/${id}`, {
        header: ntkData.header,
        poc: ntkData.poc,
        summary: ntkData.summary,
        sourceText: ntkData.sourceText,
      })

      if (response.data.success) {
        // Reload to get updated data
        const reloadResponse = await api.get(`/api/ntk/${id}`)
        if (reloadResponse.data.success) {
          setNtkData(reloadResponse.data.ntk)
        }
      } else {
        setError('Failed to save changes')
      }
    } catch (err: any) {
      console.error('NTK save error:', err)
      setError(err.response?.data?.error || 'Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading NTK...</div>
        </div>
      </div>
    )
  }

  if (error || !ntkData) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-2xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'NTK not found'}</p>
          <button
            type="button"
            onClick={() => router.push('/ntk')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to NTK List
          </button>
        </div>
      </div>
    )
  }

  const sourceText = ntkData.sourceText

  if (!ntkData.header || !ntkData.poc || !ntkData.summary) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid NTK Data</h2>
          <p className="text-gray-600">This NTK does not have valid content.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/ntk')}
            className="text-gray-600 hover:text-gray-900 mb-2 text-sm"
          >
            ← Back to NTK List
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{ntkData.header}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(ntkData.createdAt).toLocaleDateString()}
            {ntkData.updatedAt !== ntkData.createdAt && (
              <span> • Updated {new Date(ntkData.updatedAt).toLocaleDateString()}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/ntk/new`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New NTK
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {ntkData.draftContent ? (
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <NTKPreview
            ntk={ntkData.draftContent}
            sourceText={ntkData.sourceText}
            onSave={handleSave}
            isLoading={isSaving}
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-6 bg-white space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 uppercase">{ntkData.header}</h2>
            <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: ntkData.poc.replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
            <p className="mt-2 text-gray-700 leading-relaxed">{ntkData.summary}</p>
          </div>
          {ntkData.sourceText && (
            <details className="border-t pt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                View Source Text
              </summary>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{ntkData.sourceText}</pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

