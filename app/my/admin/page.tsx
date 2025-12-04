'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'

interface AdminWorkItem {
  id: string
  title: string
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [items, setItems] = useState<AdminWorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminWorkItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    status: 'open',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadItems()
      }
    }
  }, [router])

  async function loadItems() {
    setLoading(true)
    try {
      const response = await api.get('/api/admin/items')
      if (response.data.success) {
        setItems(response.data.items)
      }
    } catch (error: any) {
      console.error('Failed to load admin items:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      await api.post('/api/admin/item', {
        title: formData.title.trim(),
        notes: formData.notes.trim() || null,
        status: formData.status,
      })
      setFormData({ title: '', notes: '', status: 'open' })
      setShowCreateForm(false)
      loadItems()
    } catch (error: any) {
      console.error('Failed to create item:', error)
      alert('Failed to create item: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleUpdate(itemId: string) {
    try {
      await api.put(`/api/admin/item/${itemId}`, {
        title: formData.title.trim(),
        notes: formData.notes.trim() || null,
        status: formData.status,
      })
      setEditingItem(null)
      setFormData({ title: '', notes: '', status: 'open' })
      loadItems()
    } catch (error: any) {
      console.error('Failed to update item:', error)
      alert('Failed to update item: ' + (error.response?.data?.error || error.message))
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await api.delete(`/api/admin/item/${itemId}`)
      loadItems()
    } catch (error: any) {
      console.error('Failed to delete item:', error)
      alert('Failed to delete item: ' + (error.response?.data?.error || error.message))
    }
  }

  function startEditing(item: AdminWorkItem) {
    setEditingItem(item)
    setFormData({
      title: item.title,
      notes: item.notes || '',
      status: item.status,
    })
    setShowCreateForm(false)
  }

  function cancelEditing() {
    setEditingItem(null)
    setFormData({ title: '', notes: '', status: 'open' })
  }

  function cancelCreate() {
    setShowCreateForm(false)
    setFormData({ title: '', notes: '', status: 'open' })
  }

  const statusLabels: Record<string, string> = {
    open: 'Open',
    done: 'Done',
    blocked: 'Blocked',
    watch: 'Watch',
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
              <h1 className="text-xl font-bold text-gray-900">Admin Work Items</h1>
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
        {/* Create Button */}
        <div className="mb-6">
          {!showCreateForm && !editingItem && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + Create New Item
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Admin Item</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Item title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                  <option value="watch">Watch</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={cancelCreate}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No admin items yet. Create your first one!
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {editingItem?.id === item.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            rows={2}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="open">Open</option>
                            <option value="done">Done</option>
                            <option value="blocked">Blocked</option>
                            <option value="watch">Watch</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleUpdate(item.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{item.notes || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {statusLabels[item.status] || item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => startEditing(item)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </main>
      </div>
    </div>
  )
}

