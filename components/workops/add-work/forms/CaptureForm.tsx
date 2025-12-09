'use client'

import { useState } from 'react'
import { WorkOpsItemType, WorkOpsSource } from '@prisma/client'

interface CaptureFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

export default function CaptureForm({ onSubmit, loading }: CaptureFormProps) {
  const [captureText, setCaptureText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!captureText.trim()) return

    onSubmit({
      title: captureText.trim().substring(0, 100) || 'Quick Capture',
      body: captureText.trim(),
      itemType: WorkOpsItemType.capture,
      source: WorkOpsSource.manual,
      urgency: null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="captureText" className="block text-sm font-medium text-gray-700 mb-2">
          Capture Text <span className="text-red-500">*</span>
        </label>
        <textarea
          id="captureText"
          rows={8}
          required
          value={captureText}
          onChange={(e) => setCaptureText(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Quickly capture your thoughts, ideas, or notes..."
        />
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading || !captureText.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Capture'}
        </button>
      </div>
    </form>
  )
}

