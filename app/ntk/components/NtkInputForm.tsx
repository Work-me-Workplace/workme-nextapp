'use client'

import { useState } from 'react'
import { ParsedNTKInput } from '@/lib/ntk/ntkTypes'
import api from '@/lib/api'

interface NtkInputFormProps {
  onParsed: (data: ParsedNTKInput) => void
}

export default function NtkInputForm({ onParsed }: NtkInputFormProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParse = async () => {
    if (!text.trim()) {
      setError('Please enter some text to parse')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/ntk/parse', { text })

      if (response.data.error) {
        throw new Error(response.data.error || 'Failed to parse text')
      }

      onParsed(response.data as ParsedNTKInput)
    } catch (err: any) {
      console.error('Parse error:', err)
      setError(err.message || 'Failed to parse text. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Parse Need-to-Know
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Paste raw communication text below. The parser will extract structured fields.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <textarea
        className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        placeholder="Paste raw communication text here..."
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
        disabled={loading}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Parsing...' : 'Parse Need-to-Know'}
        </button>

        {loading && (
          <span className="text-sm text-gray-500">Extracting fields...</span>
        )}
      </div>
    </div>
  )
}

