'use client'

import { useState, useEffect } from 'react'
import { WorkOpsItemType, WorkOpsSource } from '@prisma/client'
import api from '@/lib/api'

interface ExternalPressuresFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

interface ExternalPressure {
  id: string
  source: string
  category?: string | null
  summary: string
  impact?: string | null
}

export default function ExternalPressuresForm({ onSubmit, loading }: ExternalPressuresFormProps) {
  const [pressures, setPressures] = useState<ExternalPressure[]>([])
  const [loadingPressures, setLoadingPressures] = useState(true)
  const [selectedPressure, setSelectedPressure] = useState<ExternalPressure | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPressures()
  }, [])

  async function loadPressures() {
    try {
      setLoadingPressures(true)
      // TODO: Replace with actual API endpoint when ExternalCompanyPressure API is built
      // For now, return empty array
      setPressures([])
    } catch (error) {
      console.error('Failed to load external pressures:', error)
    } finally {
      setLoadingPressures(false)
    }
  }

  const filteredPressures = pressures.filter(pressure =>
    pressure.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pressure.source.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (pressure: ExternalPressure) => {
    setSelectedPressure(pressure)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPressure) return

    onSubmit({
      title: `${selectedPressure.source}: ${selectedPressure.summary.substring(0, 100)}`,
      body: selectedPressure.impact || selectedPressure.summary,
      itemType: WorkOpsItemType.external_pressure,
      source: WorkOpsSource.system,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search External Pressures
        </label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search by source or summary..."
        />
      </div>

      {loadingPressures ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : pressures.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No external pressures available yet.</p>
          <p className="text-sm text-gray-400 mt-2">This feature will be available when External Pressures are created.</p>
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
            {filteredPressures.map((pressure) => (
              <button
                key={pressure.id}
                type="button"
                onClick={() => handleSelect(pressure)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedPressure?.id === pressure.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{pressure.source}</h4>
                      {pressure.category && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {pressure.category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{pressure.summary}</p>
                    {pressure.impact && (
                      <p className="text-sm text-gray-500 mt-2 italic">{pressure.impact}</p>
                    )}
                  </div>
                  {selectedPressure?.id === pressure.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading || !selectedPressure}
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

