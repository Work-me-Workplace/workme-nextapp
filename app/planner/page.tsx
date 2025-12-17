'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Plus, Folder, Calendar, FileText, X } from 'lucide-react'
import AddPlannedItemModal from '@/components/planner/AddPlannedItemModal'

interface PlannerContainer {
  id: string
  name: string
  description: string | null
  timeframeLabel: string | null
  createdAt: string
  _count: {
    items: number
  }
}

interface PlannedItem {
  id: string
  itemKind: string
  title: string
  description: string | null
  plannedTimeLabel: string
  plannedTimeAnchor: string | null
  notes: string | null
  createdAt: string
  plannerContainer: {
    id: string
    name: string
    timeframeLabel: string | null
  }
}

export default function PlannerPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [containers, setContainers] = useState<PlannerContainer[]>([])
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
  const [items, setItems] = useState<PlannedItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadContainers()
      }
    }
  }, [router])

  const loadContainers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/planner/containers')
      if (response.data.success) {
        setContainers(response.data.containers)
      } else {
        setError(response.data.error || 'Failed to load containers')
      }
    } catch (err: any) {
      console.error('Failed to load containers:', err)
      setError(err.response?.data?.error || 'Failed to load containers')
    } finally {
      setLoading(false)
    }
  }

  const loadItems = async (containerId: string) => {
    try {
      setLoading(true)
      const response = await api.get(`/api/planner/items?containerId=${containerId}`)
      if (response.data.success) {
        setItems(response.data.items)
      } else {
        setError(response.data.error || 'Failed to load items')
      }
    } catch (err: any) {
      console.error('Failed to load items:', err)
      setError(err.response?.data?.error || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const handleContainerClick = (containerId: string) => {
    setSelectedContainerId(containerId)
    loadItems(containerId)
  }

  const handleBackToList = () => {
    setSelectedContainerId(null)
    setItems([])
  }

  const handleAddSuccess = () => {
    if (selectedContainerId) {
      loadItems(selectedContainerId)
    } else {
      loadContainers()
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Planner</h1>
          <p className="text-gray-600 mt-2">Conceptual planning staging area for future ideas</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!selectedContainerId ? (
          // Containers List View
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Containers</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Container
              </button>
            </div>

            {containers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Containers</h3>
                <p className="text-gray-600 mb-4">Create a container to start planning.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create Your First Container
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    onClick={() => handleContainerClick(container.id)}
                    className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Folder className="h-8 w-8 text-blue-600" />
                      <span className="text-sm text-gray-500">
                        {container._count.items} {container._count.items === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{container.name}</h3>
                    {container.description && (
                      <p className="text-gray-600 text-sm mb-2">{container.description}</p>
                    )}
                    {container.timeframeLabel && (
                      <p className="text-gray-500 text-sm">{container.timeframeLabel}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Items List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToList}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Containers
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {containers.find(c => c.id === selectedContainerId)?.name || 'Items'}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items</h3>
                <p className="text-gray-600 mb-4">Add planned items to this container.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Add Your First Item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.itemKind} • {item.plannedTimeLabel}
                        </p>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-gray-600 mt-2">{item.description}</p>
                    )}
                    {item.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500 italic">{item.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showAddModal && (
          <AddPlannedItemModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
            containers={containers}
            defaultContainerId={selectedContainerId}
          />
        )}
      </main>
    </div>
  )
}


