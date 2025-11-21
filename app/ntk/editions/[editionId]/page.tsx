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
}

interface NTKEdition {
  id: string
  title: string | null
  date: string | null
  createdAt: string
  items: NTKItem[]
  originator: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
}

export default function EditionViewPage() {
  const router = useRouter()
  const params = useParams()
  const editionId = params.editionId as string

  const [edition, setEdition] = useState<NTKEdition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadEdition = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get(`/api/ntk/editions/${editionId}`)

        if (response.data.success && response.data.edition) {
          setEdition(response.data.edition)
        } else {
          setError(response.data.error || 'Failed to load edition')
        }
      } catch (err: any) {
        console.error('Edition load error:', err)
        setError(err.response?.data?.error || 'Failed to load edition. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (editionId) {
      loadEdition()
    }
  }, [editionId])

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
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading edition...</div>
        </div>
      </div>
    )
  }

  if (error || !edition) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Edition not found'}</p>
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
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push('/ntk')}
          className="text-blue-600 hover:underline mb-4"
        >
          ← Back to NTK Library
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {edition.title || 'NTK Edition'}
        </h1>
        {edition.date && (
          <p className="text-gray-600">
            Date: {new Date(edition.date).toLocaleDateString()}
          </p>
        )}
        <p className="text-sm text-gray-500">
          Created {new Date(edition.createdAt).toLocaleDateString()}
          {edition.originator && (
            <span>
              {' '}
              by {edition.originator.firstName} {edition.originator.lastName}
            </span>
          )}
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Items ({edition.items.length})
        </h2>
      </div>

      {edition.items.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">No items in this edition</p>
        </div>
      ) : (
        <div className="space-y-4">
          {edition.items.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      {item.inputId}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  {item.plainLanguage ? (
                    <p className="text-gray-700 mb-2">{item.plainLanguage}</p>
                  ) : (
                    <p className="text-gray-500 italic mb-2">Not generated yet</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/ntk/items/${item.id}`)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  View / Edit
                </button>
                {item.status !== 'FINAL' && (
                  <button
                    type="button"
                    onClick={() => router.push(`/ntk/items/${item.id}`)}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                  >
                    Generate / Regenerate
                  </button>
                )}
              </div>

              {item.feedback && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Feedback:</p>
                  <p className="text-sm text-gray-700">{item.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

