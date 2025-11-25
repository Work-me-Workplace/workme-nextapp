'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface Holiday {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

export default function HolidayListPage() {
  const router = useRouter()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHolidays = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get('/api/holidays')

        if (response.data.success && response.data.data) {
          setHolidays(response.data.data)
        } else {
          setError(response.data.error || 'Failed to load holidays')
        }
      } catch (err: any) {
        console.error('Holiday list load error:', err)
        setError(err.response?.data?.error || 'Failed to load holidays. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadHolidays()
  }, [])

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading holidays...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Holiday Builder</h1>
          <p className="text-gray-600">Create and manage holiday content</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/holiday/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Add Holiday
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {holidays.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Holidays Yet</h2>
          <p className="text-gray-600 mb-6">Create your first holiday to get started</p>
          <button
            type="button"
            onClick={() => router.push('/holiday/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Add Holiday
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => router.push(`/holiday/${holiday.slug}`)}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {holiday.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Slug: {holiday.slug}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/holiday/${holiday.slug}`)
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Open Builder
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

