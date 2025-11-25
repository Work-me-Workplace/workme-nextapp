'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function NewHolidayPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name || !slug) {
      setError('Name and slug are required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post('/api/holidays/create', {
        name,
        slug,
      })

      if (response.data.success) {
        router.push(`/holiday/${slug}`)
      } else {
        setError(response.data.error || 'Failed to create holiday')
      }
    } catch (err: any) {
      console.error('Create holiday error:', err)
      setError(err.response?.data?.error || 'Failed to create holiday. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-')) {
      setSlug(
        value
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      )
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Holiday</h1>
        <p className="text-gray-600">Add a new holiday to the builder</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Holiday Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Thanksgiving, Veterans Day"
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            Slug (URL-friendly identifier)
          </label>
          <input
            type="text"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., thanksgiving, veterans-day"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Used in URLs. Lowercase, hyphens only (e.g., veterans-day)
          </p>
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
            {isSubmitting ? 'Creating...' : 'Create Holiday'}
          </button>
        </div>
      </form>
    </div>
  )
}

