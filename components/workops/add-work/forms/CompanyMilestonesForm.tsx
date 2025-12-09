'use client'

import { useState, useEffect } from 'react'
import { WorkOpsItemType, WorkOpsSource } from '@prisma/client'
import api from '@/lib/api'

interface CompanyMilestonesFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

interface Milestone {
  id: string
  title: string
  description?: string | null
  date: string
}

export default function CompanyMilestonesForm({ onSubmit, loading }: CompanyMilestonesFormProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loadingMilestones, setLoadingMilestones] = useState(true)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  useEffect(() => {
    loadMilestones()
  }, [])

  async function loadMilestones() {
    try {
      setLoadingMilestones(true)
      // TODO: Replace with actual API endpoint when CompanyMilestones API is built
      // For now, return empty array
      setMilestones([])
    } catch (error) {
      console.error('Failed to load milestones:', error)
    } finally {
      setLoadingMilestones(false)
    }
  }

  const handleSelect = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMilestone) return

    onSubmit({
      title: selectedMilestone.title,
      body: selectedMilestone.description || null,
      itemType: WorkOpsItemType.signal,
      source: WorkOpsSource.system,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {loadingMilestones ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No company milestones available yet.</p>
          <p className="text-sm text-gray-400 mt-2">This feature will be available when Company Milestones are created.</p>
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
            {milestones.map((milestone) => (
              <button
                key={milestone.id}
                type="button"
                onClick={() => handleSelect(milestone)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedMilestone?.id === milestone.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    )}
                    <span className="inline-block mt-2 text-xs text-gray-500">
                      {new Date(milestone.date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedMilestone?.id === milestone.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading || !selectedMilestone}
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

