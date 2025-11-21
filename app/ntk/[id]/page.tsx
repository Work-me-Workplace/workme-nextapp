'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import NTKPreview from '@/components/ntk/NTKPreview'
import type { NTKStructure } from '@/lib/services/ntk-generator'

interface NTKOutput {
  id: string
  title: string
  description?: string
  draftContent?: NTKStructure
  metadata?: {
    sourceText?: string
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

  const [ntkOutput, setNtkOutput] = useState<NTKOutput | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadNTK = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get(`/api/output-standalone/${id}`)

        if (response.data.success && response.data.data) {
          const data = response.data.data

          // Verify this is an NTK output
          if (data.outputType !== 'ntk') {
            setError('This is not an NTK output')
            return
          }

          setNtkOutput(data)
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
    if (!ntkOutput || !ntkOutput.draftContent) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await api.put(`/api/output-standalone/${id}`, {
        title: ntkOutput.draftContent.title,
        description: ntkOutput.draftContent.summary,
        draftContent: ntkOutput.draftContent,
      })

      if (response.data.success) {
        // Reload to get updated data
        const reloadResponse = await api.get(`/api/output-standalone/${id}`)
        if (reloadResponse.data.success) {
          setNtkOutput(reloadResponse.data.data)
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

  if (error || !ntkOutput) {
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

  const ntkData = ntkOutput.draftContent
  const sourceText = ntkOutput.metadata?.sourceText

  if (!ntkData) {
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
          <h1 className="text-3xl font-bold text-gray-900">{ntkOutput.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Created {new Date(ntkOutput.createdAt).toLocaleDateString()}
            {ntkOutput.updatedAt !== ntkOutput.createdAt && (
              <span> • Updated {new Date(ntkOutput.updatedAt).toLocaleDateString()}</span>
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

      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <NTKPreview
          ntk={ntkData}
          sourceText={sourceText}
          onSave={handleSave}
          isLoading={isSaving}
        />
      </div>
    </div>
  )
}

