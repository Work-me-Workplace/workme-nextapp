'use client'

import { useState } from 'react'
import EventManualForm from './EventManualForm'

interface EventAIFormProps {
  onBack: () => void
}

export default function EventAIForm({ onBack }: EventAIFormProps) {
  const [pastedText, setPastedText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsedData, setParsedData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

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
      const formData = new FormData()
      if (pastedText) {
        formData.append('text', pastedText)
      }
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch('/api/ai/parse-event', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.data) {
        setParsedData(result.data)
      } else {
        setError(result.error || 'Failed to parse event data')
      }
    } catch (err) {
      console.error('Error parsing event:', err)
      setError('Failed to parse event. Please try again.')
    } finally {
      setParsing(false)
    }
  }

  // If data is parsed, show the form with pre-filled data
  if (parsedData) {
    const formData = {
      title: parsedData.title || '',
      description: parsedData.description || '',
      startDate: parsedData.startDate ? new Date(parsedData.startDate).toISOString().split('T')[0] : '',
      startTime: parsedData.startTime || '',
      endDate: parsedData.endDate ? new Date(parsedData.endDate).toISOString().split('T')[0] : '',
      endTime: parsedData.endTime || '',
      location: parsedData.location || '',
      eventCategory: parsedData.eventCategory || '',
      pocFirstName: parsedData.pocFirstName || '',
      pocLastName: parsedData.pocLastName || '',
      pocEmail: parsedData.pocEmail || '',
      pocPhone: parsedData.pocPhone || '',
      eventDate: parsedData.eventDate ? new Date(parsedData.eventDate).toISOString().split('T')[0] : '',
      registrationRequired: parsedData.registrationRequired || '',
      registrationLink: parsedData.registrationLink || '',
      speakers: parsedData.speakers || [],
      foodProvided: parsedData.foodProvided || '',
      foodTypes: parsedData.foodTypes || '',
      promotionNeeds: parsedData.promotionNeeds || [],
    }

    return (
      <div>
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✓ Event data parsed successfully! Review and edit the fields below before submitting.
          </p>
        </div>
        <EventManualForm initialData={formData} onBack={onBack} />
      </div>
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
            Paste Event Text
          </label>
          <textarea
            id="pastedText"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Paste event announcement, email, or any unstructured event text here..."
          />
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

