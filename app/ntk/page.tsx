'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface NTKListItem {
  id: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
}

export default function NTKListPage() {
  const router = useRouter()
  const [ntks, setNtks] = useState<NTKListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadNTKs = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get('/api/output-standalone')

        if (response.data.success && response.data.data) {
          // Filter to only NTK outputs
          const ntkOutputs = response.data.data.filter(
            (output: any) => output.outputType === 'ntk'
          )
          setNtks(ntkOutputs)
        } else {
          setError(response.data.error || 'Failed to load NTKs')
        }
      } catch (err: any) {
        console.error('NTK list load error:', err)
        setError(err.response?.data?.error || 'Failed to load NTKs. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadNTKs()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this NTK?')) return

    try {
      const response = await api.delete(`/api/output-standalone/${id}`)

      if (response.data.success) {
        // Remove from list
        setNtks(ntks.filter((ntk) => ntk.id !== id))
      } else {
        setError('Failed to delete NTK')
      }
    } catch (err: any) {
      console.error('NTK delete error:', err)
      setError(err.response?.data?.error || 'Failed to delete NTK. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading NTKs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NTK Library</h1>
          <p className="text-gray-600">View and manage your Need-to-Know documents</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/ntk/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Create New NTK
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {ntks.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No NTKs Yet</h2>
          <p className="text-gray-600 mb-6">Create your first Need-to-Know document to get started</p>
          <button
            type="button"
            onClick={() => router.push('/ntk/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create New NTK
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {ntks.map((ntk) => (
            <div
              key={ntk.id}
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => router.push(`/ntk/${ntk.id}`)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {ntk.title}
                  </h3>
                  {ntk.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {ntk.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Created {new Date(ntk.createdAt).toLocaleDateString()}
                    {ntk.updatedAt !== ntk.createdAt && (
                      <span> • Updated {new Date(ntk.updatedAt).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/ntk/${ntk.id}`)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ntk.id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

