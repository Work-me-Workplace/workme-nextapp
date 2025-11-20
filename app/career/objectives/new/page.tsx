'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createObjective } from '@/lib/actions/objectives'

export default function NewObjectivePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    howMeasured: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const data: any = {
      title: formData.title,
    }

    if (formData.description) data.description = formData.description
    if (formData.howMeasured) data.howMeasured = formData.howMeasured

    const result = await createObjective(data)
    setLoading(false)

    if (result.success) {
      router.push('/objectives')
    } else {
      alert('Failed to create objective: ' + JSON.stringify(result.error))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/objectives" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Objectives
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">New Objective</h2>
        <p className="text-gray-600 mt-2">Create a new objective</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Improve team communication"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Optional description..."
          />
        </div>

        <div>
          <label htmlFor="howMeasured" className="block text-sm font-medium text-gray-700 mb-2">
            How Measured
          </label>
          <textarea
            id="howMeasured"
            rows={2}
            value={formData.howMeasured}
            onChange={(e) => setFormData({ ...formData, howMeasured: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="How will this objective be measured?"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Objective'}
          </button>
          <Link
            href="/objectives"
            className="flex-1 rounded-lg bg-gray-200 text-gray-700 px-6 py-3 font-semibold hover:bg-gray-300 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
