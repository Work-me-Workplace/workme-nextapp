'use client'

import { useState } from 'react'
import EventReviewScreen from './EventReviewScreen'
import type { EventIngestionResponse } from '@/lib/types/event-ingestion'
import api from '@/lib/api'

type ViewMode = 'input' | 'review'

interface EventAIFormProps {
  onBack: () => void
}

export default function EventAIForm({ onBack }: EventAIFormProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('input')
  const [pastedText, setPastedText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [ingestionData, setIngestionData] = useState<EventIngestionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  
  // Optional user context - free text for human notes/instructions
  const [userContext, setUserContext] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      // For now, we'll just store the file reference
      // In a full implementation, you'd extract text from images using OCR
    }
  }

  const handleParse = async () => {
    if (!pastedText.trim() && !file) {
      setError('Please paste event text or upload a file')
      return
    }

    setParsing(true)
    setError(null)

    try {
      // Build request body
      const requestBody: {
        rawText: string
        userContext?: string
      } = {
        rawText: pastedText.trim(),
      }

      // Add user context if provided (free text for human notes/instructions)
      if (userContext.trim()) {
        requestBody.userContext = userContext.trim()
      }

      const response = await api.post('/api/ingest/event/ai', requestBody)

      if (response.data.success && response.data.data) {
        setIngestionData(response.data.data)
        setViewMode('review')
      } else {
        setError(response.data.error || 'Failed to parse event data')
      }
    } catch (err) {
      console.error('Error parsing event:', err)
      setError('Failed to parse event. Please try again.')
    } finally {
      setParsing(false)
    }
  }

  // Show review screen if data is parsed
  if (viewMode === 'review' && ingestionData) {
    return (
      <EventReviewScreen
        ingestionData={ingestionData}
        onBack={() => setViewMode('input')}
        onEdit={() => {
          // For now, just go back to input to re-parse
          // Future: could show editable form
          setViewMode('input')
        }}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Parse Event with AI</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Change method
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="pastedText" className="block text-sm font-medium text-gray-700 mb-2">
            Paste Event Text <span className="text-red-500">*</span>
          </label>
          <textarea
            id="pastedText"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Paste event announcement, email, or any unstructured event text here..."
            required
          />
        </div>

        <div className="border-t pt-4">
          <label htmlFor="userContext" className="block text-sm font-medium text-gray-700 mb-2">
            Optional Context (help AI infer missing details)
          </label>
          <textarea
            id="userContext"
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Add any additional context, notes, or instructions to help the AI parse the event (e.g., 'This is a company-wide event', 'Focus on the keynote speaker', etc.)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Provide additional context or instructions to guide the AI's interpretation
          </p>
        </div>

        <div>
          <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-2">
            Or Upload Screenshot/Image (optional)
          </label>
          <input
            type="file"
            id="fileUpload"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleParse}
            disabled={parsing || (!pastedText.trim() && !file)}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {parsing ? 'Parsing with AI...' : 'Parse With AI'}
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

