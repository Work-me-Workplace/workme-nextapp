'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCommsOutput } from '@/lib/actions/comms-outputs'

export default function NewCommsOutputPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    wordCount: '',
    dateSent: '',
    topics: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const data: any = {
      type: formData.type,
      title: formData.title,
    }

    if (formData.description) data.description = formData.description
    if (formData.wordCount) data.wordCount = parseInt(formData.wordCount)
    if (formData.dateSent) data.dateSent = new Date(formData.dateSent)
    if (formData.topics) {
      try {
        const topics = JSON.parse(formData.topics)
        data.topics = topics
      } catch {
        // If not valid JSON, treat as comma-separated
        data.topics = formData.topics.split(',').map(s => s.trim())
      }
    }

    const result = await createCommsOutput(data)
    setLoading(false)

    if (result.success) {
      router.push('/comms-outputs')
    } else {
      alert('Failed to create comms output: ' + JSON.stringify(result.error))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/comms-outputs" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Comms Outputs
        </Link>
        <h2 className="text-3xl font-bold text-gray-900">New Communication Output</h2>
        <p className="text-gray-600 mt-2">Create a new communication output</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Type *
          </label>
          <input
            type="text"
            id="type"
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., email, flyer, digest"
          />
        </div>

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
            placeholder="e.g., Weekly Newsletter"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-2">
              Word Count
            </label>
            <input
              type="number"
              id="wordCount"
              min="1"
              value={formData.wordCount}
              onChange={(e) => setFormData({ ...formData, wordCount: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dateSent" className="block text-sm font-medium text-gray-700 mb-2">
              Date Sent
            </label>
            <input
              type="date"
              id="dateSent"
              value={formData.dateSent}
              onChange={(e) => setFormData({ ...formData, dateSent: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-2">
            Topics (JSON array or comma-separated)
          </label>
          <textarea
            id="topics"
            rows={2}
            value={formData.topics}
            onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder='["Topic 1", "Topic 2"] or Topic 1, Topic 2'
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Comms Output'}
          </button>
          <Link
            href="/comms-outputs"
            className="flex-1 rounded-lg bg-gray-200 text-gray-700 px-6 py-3 font-semibold hover:bg-gray-300 transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

