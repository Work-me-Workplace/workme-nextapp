'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'

interface MyWorkItem {
  id: string
  title: string
  notes: string | null
  status: string
  dueDate: string | null
  tag: string | null
  createdAt: string
  updatedAt: string
}

interface MyWorkOutlook {
  id: string
  workMeId: string
  createdAt: string
  updatedAt: string
  items: MyWorkItem[]
}

const STATUS_OPTIONS = ['open', 'done', 'blocked', 'watch']
const TAG_OPTIONS = ['comms', 'admin', 'personal', 'project', 'meeting']

export default function MyWorkOutlookPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [outlook, setOutlook] = useState<MyWorkOutlook | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [editingItem, setEditingItem] = useState<MyWorkItem | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    notes: '',
    status: 'open',
    dueDate: '',
    tag: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadOutlook()
      }
    }
  }, [router])

  async function loadOutlook() {
    setLoading(true)
    try {
      const response = await api.get('/api/outlook')
      if (response.data.success) {
        setOutlook(response.data.outlook)
      }
    } catch (error: any) {
      console.error('Failed to load outlook:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickAddTitle.trim()) return

    try {
      await api.post('/api/outlook/item', {
        title: quickAddTitle.trim(),
        status: 'open',
      })
      setQuickAddTitle('')
      loadOutlook()
    } catch (error: any) {
      console.error('Failed to create item:', error)
      alert('Failed to create item: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleUpdateItem(itemId: string) {
    try {
      await api.put(`/api/outlook/item/${itemId}`, {
        title: editForm.title,
        notes: editForm.notes || null,
        status: editForm.status,
        dueDate: editForm.dueDate || null,
        tag: editForm.tag || null,
      })
      setEditingItem(null)
      setEditForm({ title: '', notes: '', status: 'open', dueDate: '', tag: '' })
      loadOutlook()
    } catch (error: any) {
      console.error('Failed to update item:', error)
      alert('Failed to update item: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await api.delete(`/api/outlook/item/${itemId}`)
      loadOutlook()
    } catch (error: any) {
      console.error('Failed to delete item:', error)
      alert('Failed to delete item: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleToggleStatus(item: MyWorkItem) {
    const currentIndex = STATUS_OPTIONS.indexOf(item.status)
    const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length
    const nextStatus = STATUS_OPTIONS[nextIndex]

    try {
      await api.put(`/api/outlook/item/${item.id}`, {
        status: nextStatus,
      })
      loadOutlook()
    } catch (error: any) {
      console.error('Failed to update status:', error)
    }
  }

  function startEditing(item: MyWorkItem) {
    setEditingItem(item)
    setEditForm({
      title: item.title,
      notes: item.notes || '',
      status: item.status,
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
      tag: item.tag || '',
    })
  }

  function cancelEditing() {
    setEditingItem(null)
    setEditForm({ title: '', notes: '', status: 'open', dueDate: '', tag: '' })
  }

  // Group items by status
  const itemsByStatus = outlook?.items.reduce((acc, item) => {
    if (!acc[item.status]) {
      acc[item.status] = []
    }
    acc[item.status].push(item)
    return acc
  }, {} as Record<string, MyWorkItem[]>) || {}

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
              <h1 className="text-xl font-bold text-gray-900">My Work Outlook</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/mywork')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Back to My Work
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <SidebarNav />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Add */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Add</h2>
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <input
              type="text"
              value={quickAddTitle}
              onChange={(e) => setQuickAddTitle(e.target.value)}
              placeholder="Add a new work item..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Add
            </button>
          </form>
        </div>

        {/* Items Grouped by Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATUS_OPTIONS.map((status) => {
            const items = itemsByStatus[status] || []
            const statusLabels: Record<string, string> = {
              open: 'Open',
              done: 'Done',
              blocked: 'Blocked',
              watch: 'Watch',
            }

            return (
              <div key={status} className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statusLabels[status]} ({items.length})
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No items</p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
                      >
                        {editingItem?.id === item.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Title"
                            />
                            <textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Notes"
                              rows={2}
                            />
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {statusLabels[opt]}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={editForm.dueDate}
                              onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <select
                              value={editForm.tag}
                              onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="">No tag</option>
                              {TAG_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateItem(item.id)}
                                className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                              <button
                                onClick={() => handleToggleStatus(item)}
                                className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                title="Toggle status"
                              >
                                {statusLabels[item.status]}
                              </button>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-600 mb-2">{item.notes}</p>
                            )}
                            {item.dueDate && (
                              <p className="text-xs text-gray-500 mb-2">
                                Due: {new Date(item.dueDate).toLocaleDateString()}
                              </p>
                            )}
                            {item.tag && (
                              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mb-2">
                                {item.tag}
                              </span>
                            )}
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => startEditing(item)}
                                className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </main>
      </div>
    </div>
  )
}

