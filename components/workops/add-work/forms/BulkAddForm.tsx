'use client'

import { useState } from 'react'
import { List } from 'lucide-react'
import api from '@/lib/api'

interface BulkAddFormProps {
  onBack: () => void
  onSuccess: () => void
}

export default function BulkAddForm({ onBack, onSuccess }: BulkAddFormProps) {
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawText.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/api/workops/item/create-bulk', {
        rawText: rawText.trim(),
      })
      if (response.data.success) {
        onSuccess()
      } else {
        setError(response.data.error || 'Failed to create tasks')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create tasks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm"
      >
        ← Back to options
      </button>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Bulk add tasks</h3>
        <p className="text-sm text-gray-600">
          Paste a list — one per line or use bullets (-, *, •) or numbers (1. 2.). We’ll create a task for each. No AI, instant.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={
            'e.g.\n- Call vendor\n- Review deck\n- Send recap'
          }
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !rawText.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <List className="h-4 w-4" />
            {loading ? 'Creating…' : 'Create tasks'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
