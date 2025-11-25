'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function UploadAssetPage() {
  const router = useRouter()
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('general')
  const [holidaySlug, setHolidaySlug] = useState('')
  const [holidays, setHolidays] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!category) {
      setError('Category is required')
      return
    }

    if (uploadType === 'file' && !file) {
      setError('Please select a file')
      return
    }

    if (uploadType === 'url' && !url) {
      setError('Please enter a URL')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('category', category)
      if (holidaySlug) {
        formData.append('holidaySlug', holidaySlug)
      }

      if (uploadType === 'file' && file) {
        formData.append('file', file)
      } else if (uploadType === 'url') {
        formData.append('url', url)
      }

      const response = await api.post('/api/assets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/assets')
        }, 2000)
      } else {
        setError(response.data.error || 'Failed to upload asset')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.response?.data?.error || 'Failed to upload asset. Please try again.')
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Asset</h1>
        <p className="text-gray-600">Upload a new image to the repository</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          Asset uploaded successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Type
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setUploadType('file')}
              className={`px-4 py-2 rounded-lg font-medium ${
                uploadType === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadType('url')}
              className={`px-4 py-2 rounded-lg font-medium ${
                uploadType === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              From URL
            </button>
          </div>
        </div>

        {uploadType === 'file' ? (
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Image File
            </label>
            <input
              type="file"
              id="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        ) : (
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
              required
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
            {isSubmitting ? 'Uploading...' : 'Upload Asset'}
          </button>
        </div>
      </form>
    </div>
  )
}

