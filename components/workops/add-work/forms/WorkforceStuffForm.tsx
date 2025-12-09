'use client'

import { useState, useEffect } from 'react'
import { WorkOpsItemType, WorkOpsSource } from '@prisma/client'
import api from '@/lib/api'

interface WorkforceStuffFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

interface WorkforceItem {
  id: string
  type: string
  title: string
  summary: string
}

export default function WorkforceStuffForm({ onSubmit, loading }: WorkforceStuffFormProps) {
  const [items, setItems] = useState<WorkforceItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [selectedItem, setSelectedItem] = useState<WorkforceItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      setLoadingItems(true)
      const companyUnitId = localStorage.getItem('companyUnit')
      if (!companyUnitId) {
        setLoadingItems(false)
        return
      }

      const response = await api.get(`/api/workforcestuff?companyUnitId=${encodeURIComponent(companyUnitId)}`)
      
      if (response.data.success && response.data.items) {
        setItems(response.data.items)
      }
    } catch (error) {
      console.error('Failed to load workforce stuff:', error)
    } finally {
      setLoadingItems(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (item: WorkforceItem) => {
    setSelectedItem(item)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    onSubmit({
      title: selectedItem.title,
      body: selectedItem.summary || null,
      itemType: WorkOpsItemType.workforce_comms,
      source: WorkOpsSource.system,
      assignedBy: null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Workforce Stuff
        </label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search events, training, benefits..."
        />
      </div>

      {loadingItems ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No items found</p>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedItem?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {item.type}
                    </span>
                  </div>
                  {selectedItem?.id === item.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          type="submit"
          disabled={loading || !selectedItem}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Work Item'}
        </button>
      </div>
    </form>
  )
}

