'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { X } from 'lucide-react'

interface PlannerContainer {
  id: string
  name: string
  description: string | null
  timeframeLabel: string | null
}

interface AddPlannedItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  containers: PlannerContainer[]
  defaultContainerId?: string | null
}

export default function AddPlannedItemModal({
  isOpen,
  onClose,
  onSuccess,
  containers,
  defaultContainerId,
}: AddPlannedItemModalProps) {
  const [mode, setMode] = useState<'item' | 'container'>('item')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Item form state
  const [plannerContainerId, setPlannerContainerId] = useState<string>(defaultContainerId || '')
  const [itemKind, setItemKind] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [plannedTimeLabel, setPlannedTimeLabel] = useState('')
  const [plannedTimeAnchor, setPlannedTimeAnchor] = useState('')
  const [notes, setNotes] = useState('')

  // Container form state
  const [containerName, setContainerName] = useState('')
  const [containerDescription, setContainerDescription] = useState('')
  const [containerTimeframeLabel, setContainerTimeframeLabel] = useState('')

  useEffect(() => {
    if (defaultContainerId) {
      setPlannerContainerId(defaultContainerId)
      setMode('item')
    }
  }, [defaultContainerId])

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setMode('item')
      setPlannerContainerId(defaultContainerId || '')
      setItemKind('')
      setTitle('')
      setDescription('')
      setPlannedTimeLabel('')
      setPlannedTimeAnchor('')
      setNotes('')
      setContainerName('')
      setContainerDescription('')
      setContainerTimeframeLabel('')
      setError(null)
    }
  }, [isOpen, defaultContainerId])

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!containerName.trim()) {
      setError('Container name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/planner/containers', {
        name: containerName.trim(),
        description: containerDescription.trim() || null,
        timeframeLabel: containerTimeframeLabel.trim() || null,
      })

      if (response.data.success) {
        onSuccess() // This will refresh containers list
        onClose() // Close modal so user can reopen to add item to new container
      } else {
        setError(response.data.error || 'Failed to create container')
      }
    } catch (err: any) {
      console.error('Failed to create container:', err)
      setError(err.response?.data?.error || 'Failed to create container')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!plannerContainerId) {
      setError('Please select or create a container')
      return
    }
    if (!itemKind.trim()) {
      setError('Item kind is required')
      return
    }
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!plannedTimeLabel.trim()) {
      setError('Planned time label is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/planner/items', {
        plannerContainerId,
        itemKind: itemKind.trim(),
        title: title.trim(),
        description: description.trim() || null,
        plannedTimeLabel: plannedTimeLabel.trim(),
        plannedTimeAnchor: plannedTimeAnchor ? new Date(plannedTimeAnchor).toISOString() : null,
        notes: notes.trim() || null,
      })

      if (response.data.success) {
        onSuccess()
        onClose()
      } else {
        setError(response.data.error || 'Failed to create item')
      }
    } catch (err: any) {
      console.error('Failed to create item:', err)
      setError(err.response?.data?.error || 'Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'container' ? 'Create Container' : 'Add Planned Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {mode === 'container' ? (
            <form onSubmit={handleCreateContainer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Name *
                  </label>
                  <input
                    type="text"
                    value={containerName}
                    onChange={(e) => setContainerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={containerDescription}
                    onChange={(e) => setContainerDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeframe Label (e.g., "2026", "Q2 2026", "Rolling")
                  </label>
                  <input
                    type="text"
                    value={containerTimeframeLabel}
                    onChange={(e) => setContainerTimeframeLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2026"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Container'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planner Container *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={plannerContainerId}
                      onChange={(e) => setPlannerContainerId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a container</option>
                      {containers.map((container) => (
                        <option key={container.id} value={container.id}>
                          {container.name}
                          {container.timeframeLabel ? ` (${container.timeframeLabel})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setMode('container')}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      New
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Kind (e.g., "event", "series", "campaign") *
                  </label>
                  <input
                    type="text"
                    value={itemKind}
                    onChange={(e) => setItemKind(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="event"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Time Label (e.g., "Q2 2026", "Spring") *
                  </label>
                  <input
                    type="text"
                    value={plannedTimeLabel}
                    onChange={(e) => setPlannedTimeLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Q2 2026"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Time Anchor (optional, for sorting)
                  </label>
                  <input
                    type="datetime-local"
                    value={plannedTimeAnchor}
                    onChange={(e) => setPlannedTimeAnchor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
