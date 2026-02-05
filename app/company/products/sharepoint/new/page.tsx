'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Share2, ArrowLeft, FileText } from 'lucide-react'

export default function CreateSharepointPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    siteUrl: '',
    siteType: '',
    owner: '',
    accessLevel: '',
    lastSyncDate: '',
    notes: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) {
      alert('Name is required')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/api/company/products/sharepoint/create', {
        name: formData.name,
        description: formData.description || null,
        siteUrl: formData.siteUrl || null,
        siteType: formData.siteType || null,
        owner: formData.owner || null,
        accessLevel: formData.accessLevel || null,
        lastSyncDate: formData.lastSyncDate || null,
        notes: formData.notes || null,
      })

      if (response.data.success) {
        router.push(`/company/products/sharepoint/${response.data.product.id}`)
      } else {
        alert('Failed to create SharePoint product: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create SharePoint product:', error)
      alert('Failed to create SharePoint product: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/company/products"
            className="flex items-center text-orange-600 hover:text-orange-700 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          <Link
            href="/company/products/sharepoint/spec-generator"
            className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <FileText className="h-4 w-4 mr-1" />
            Generate Spec
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Share2 className="h-8 w-8 text-orange-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create SharePoint Product</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Engineering Team Site"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="SharePoint site description..."
              />
            </div>

            <div>
              <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Site URL
              </label>
              <input
                type="url"
                id="siteUrl"
                value={formData.siteUrl}
                onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://company.sharepoint.com/sites/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="siteType" className="block text-sm font-medium text-gray-700 mb-2">
                  Site Type
                </label>
                <select
                  id="siteType"
                  value={formData.siteType}
                  onChange={(e) => setFormData({ ...formData, siteType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select type...</option>
                  <option value="Team Site">Team Site</option>
                  <option value="Communication Site">Communication Site</option>
                  <option value="Hub Site">Hub Site</option>
                  <option value="Document Library">Document Library</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="accessLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Level
                </label>
                <select
                  id="accessLevel"
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select level...</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
                Owner/Administrator
              </label>
              <input
                type="text"
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., John Doe"
              />
            </div>

            <div>
              <label htmlFor="lastSyncDate" className="block text-sm font-medium text-gray-700 mb-2">
                Last Sync Date
              </label>
              <input
                type="date"
                id="lastSyncDate"
                value={formData.lastSyncDate}
                onChange={(e) => setFormData({ ...formData, lastSyncDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4">
              <Link
                href="/company/products"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create SharePoint Product'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
