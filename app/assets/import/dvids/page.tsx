'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function DVIDSImporterPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('general')
  const [holidaySlug, setHolidaySlug] = useState('')
  const [holidays, setHolidays] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load holidays on mount
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const response = await api.get('/api/holidays')
        if (response.data.success) {
          setHolidays(response.data.data)
        }
      } catch (err) {
        console.error('Failed to load holidays:', err)
      }
    }
    loadHolidays()
  }, [])

  const handlePreview = async () => {
    if (!url) {
      setError('Please enter a DVIDS URL')
      return
    }

    setIsPreviewing(true)
    setError(null)

    try {
      // Try to extract image URL and show preview
      // For now, just use the URL directly
      setPreviewUrl(url)
    } catch (err: any) {
      setError('Failed to preview image')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!url || !category) {
      setError('URL and category are required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post('/api/assets/import/dvids', {
        url,
        category,
        holidaySlug: holidaySlug || null,
      })

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/assets')
        }, 2000)
      } else {
        setError(response.data.error || 'Failed to import DVIDS asset')
      }
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.response?.data?.error || 'Failed to import DVIDS asset. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push('/assets')}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Assets
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">DVIDS Importer</h1>
        <p className="text-gray-600">Import images from DVIDS (Defense Visual Information Distribution Service)</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          Asset imported successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            DVIDS URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.dvidshub.net/image/1234567/..."
              required
            />
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing || !url}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreviewing ? 'Loading...' : 'Preview'}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter a DVIDS image URL or query URL
          </p>
        </div>

        {previewUrl && (
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto rounded-lg"
              onError={() => {
                setError('Failed to load preview image')
                setPreviewUrl(null)
              }}
            />
          </div>
        )}

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="holiday">Holiday</option>
            <option value="workforce">Workforce</option>
            <option value="shipyard">Shipyard</option>
            <option value="general">General NAVSEA</option>
          </select>
        </div>

        <div>
          <label htmlFor="holidaySlug" className="block text-sm font-medium text-gray-700 mb-2">
            Holiday (Optional)
          </label>
          <select
            id="holidaySlug"
            value={holidaySlug}
            onChange={(e) => setHolidaySlug(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">None</option>
            {holidays.map((holiday) => (
              <option key={holiday.id} value={holiday.slug}>
                {holiday.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Importing...' : 'Import Asset'}
          </button>
        </div>
      </form>
    </div>
  )
}

