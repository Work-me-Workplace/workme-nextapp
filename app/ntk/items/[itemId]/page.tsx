'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { NTKStatus } from '@prisma/client'

interface NTKItem {
  id: string
  inputId: string
  rawFields: Record<string, any>
  plainLanguage: string | null
  feedback: string | null
  status: NTKStatus
  createdAt: string
  updatedAt: string
  edition: {
    id: string
    title: string | null
    date: string | null
  }
}

export default function NTKItemEditPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.itemId as string

  const [item, setItem] = useState<NTKItem | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isMarkingFinal, setIsMarkingFinal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadItem = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get(`/api/ntk/items/${itemId}`)

        if (response.data.success && response.data.item) {
          const loadedItem = response.data.item
          setItem(loadedItem)
          setFeedback(loadedItem.feedback || '')
        } else {
          setError(response.data.error || 'Failed to load item')
        }
      } catch (err: any) {
        console.error('Item load error:', err)
        setError(err.response?.data?.error || 'Failed to load item. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (itemId) {
      loadItem()
    }
  }, [itemId])

  const handleRegenerate = async () => {
    if (!item) return

    setIsRegenerating(true)
    setError(null)

    try {
      const response = await api.post(`/api/ntk/items/${itemId}/regenerate`, {
        feedback: feedback.trim() || undefined,
      })

      if (response.data.success) {
        // Reload item to get updated plainLanguage
        const reloadResponse = await api.get(`/api/ntk/items/${itemId}`)
        if (reloadResponse.data.success && reloadResponse.data.item) {
          setItem(reloadResponse.data.item)
        }
      } else {
        setError(response.data.error || 'Failed to regenerate')
      }
    } catch (err: any) {
      console.error('Regenerate error:', err)
      setError(err.response?.data?.error || 'Failed to regenerate. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleMarkFinal = async () => {
    if (!item) return

    if (!confirm('Mark this item as FINAL? This cannot be undone.')) {
      return
    }

    setIsMarkingFinal(true)
    setError(null)

    try {
      const response = await api.patch(`/api/ntk/items/${itemId}/mark-final`)

      if (response.data.success) {
        // Reload item to get updated status
        const reloadResponse = await api.get(`/api/ntk/items/${itemId}`)
        if (reloadResponse.data.success && reloadResponse.data.item) {
          setItem(reloadResponse.data.item)
        }
      } else {
        setError(response.data.error || 'Failed to mark as final')
      }
    } catch (err: any) {
      console.error('Mark final error:', err)
      setError(err.response?.data?.error || 'Failed to mark as final. Please try again.')
    } finally {
      setIsMarkingFinal(false)
    }
  }

  const getStatusBadgeColor = (status: NTKStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-700'
      case 'VALIDATED':
        return 'bg-blue-100 text-blue-700'
      case 'GENERATED':
        return 'bg-green-100 text-green-700'
      case 'REVIEWED':
        return 'bg-yellow-100 text-yellow-700'
      case 'FINAL':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading item...</div>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Item not found'}</p>
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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push(`/ntk/editions/${item.edition.id}`)}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to Edition
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NTK Item</h1>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-gray-500">{item.inputId}</span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(item.status)}`}
          >
            {item.status}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Edition: {item.edition.title || 'Untitled'}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Raw Fields */}
      <div className="mb-6 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Raw Fields</h2>
        <div className="space-y-2">
          {Object.entries(item.rawFields as Record<string, any>).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-gray-700">{key}:</span>
              <span className="ml-2 text-gray-600">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plain Language */}
      <div className="mb-6 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plain Language</h2>
        {item.plainLanguage ? (
          <p className="text-gray-700 whitespace-pre-wrap">{item.plainLanguage}</p>
        ) : (
          <p className="text-gray-500 italic">Not generated yet. Click "Regenerate" to generate.</p>
        )}
      </div>

      {/* Feedback */}
      <div className="mb-6 border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Feedback (for regeneration)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter feedback to improve the plain language generation..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-2 text-sm text-gray-500">
          Provide feedback to guide the regeneration. This will be saved for audit purposes.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegenerating ? 'Regenerating...' : 'Regenerate'}
        </button>

        {item.status !== 'FINAL' && (
          <button
            type="button"
            onClick={handleMarkFinal}
            disabled={isMarkingFinal || !item.plainLanguage}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMarkingFinal ? 'Marking...' : 'Mark as Final'}
          </button>
        )}

        {item.status === 'FINAL' && (
          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
            Marked as Final
          </span>
        )}
      </div>
    </div>
  )
}

