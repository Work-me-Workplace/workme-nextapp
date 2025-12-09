'use client'

import { useState, useEffect } from 'react'
import { WorkOpsItemType, WorkOpsSource } from '@prisma/client'
import api from '@/lib/api'

interface EmployeeHighlightsFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

interface Highlight {
  id: string
  fullName: string
  awardName?: string | null
  achievement?: string | null
  citationText: string
}

export default function EmployeeHighlightsForm({ onSubmit, loading }: EmployeeHighlightsFormProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loadingHighlights, setLoadingHighlights] = useState(true)
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadHighlights()
  }, [])

  async function loadHighlights() {
    try {
      setLoadingHighlights(true)
      const response = await api.get('/api/company/highlights')
      
      if (response.data.success && response.data.highlights) {
        setHighlights(response.data.highlights)
      }
    } catch (error) {
      console.error('Failed to load highlights:', error)
    } finally {
      setLoadingHighlights(false)
    }
  }

  const filteredHighlights = highlights.filter(highlight =>
    highlight.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (highlight.awardName && highlight.awardName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSelect = (highlight: Highlight) => {
    setSelectedHighlight(highlight)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHighlight) return

    onSubmit({
      title: `${selectedHighlight.fullName} - ${selectedHighlight.awardName || 'Recognition'}`,
      body: selectedHighlight.achievement || selectedHighlight.citationText.substring(0, 500),
      itemType: WorkOpsItemType.workforce_comms, // Using workforce_comms as closest match
      source: WorkOpsSource.system,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Employee Highlights
        </label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search by name or award..."
        />
      </div>

      {loadingHighlights ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
            {filteredHighlights.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No highlights found</p>
            ) : (
              filteredHighlights.map((highlight) => (
                <button
                  key={highlight.id}
                  type="button"
                  onClick={() => handleSelect(highlight)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedHighlight?.id === highlight.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{highlight.fullName}</h4>
                      {highlight.awardName && (
                        <p className="text-sm text-gray-600 mt-1">{highlight.awardName}</p>
                      )}
                      {highlight.achievement && (
                        <p className="text-sm text-gray-500 mt-2">{highlight.achievement}</p>
                      )}
                    </div>
                    {selectedHighlight?.id === highlight.id && (
                      <span className="text-blue-600">✓</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading || !selectedHighlight}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Work Item'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

