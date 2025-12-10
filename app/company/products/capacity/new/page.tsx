'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Factory, ArrowLeft } from 'lucide-react'

export default function CreateCapacityPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contractorType: '',
    capabilities: '',
    constraints: '',
    productionRate: '',
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
      const response = await api.post('/api/company/products/capacity/create', {
        name: formData.name,
        location: formData.location || null,
        contractorType: formData.contractorType || null,
        capabilities: formData.capabilities ? formData.capabilities.split(',').map(s => s.trim()).filter(Boolean) : [],
        constraints: formData.constraints ? formData.constraints.split(',').map(s => s.trim()).filter(Boolean) : [],
        productionRate: formData.productionRate || null,
        notes: formData.notes || null,
      })

      if (response.data.success) {
        router.push(`/company/products/capacity/${response.data.product.id}`)
      } else {
        alert('Failed to create capacity product: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create capacity product:', error)
      alert('Failed to create capacity product: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
        <Link
          href="/company/products"
          className="flex items-center text-green-600 hover:text-green-700 mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Factory className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Capacity Product</h1>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Newport News Shipbuilding"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Newport News, VA"
                />
              </div>
              <div>
                <label htmlFor="contractorType" className="block text-sm font-medium text-gray-700 mb-2">
                  Contractor Type
                </label>
                <input
                  type="text"
                  id="contractorType"
                  value={formData.contractorType}
                  onChange={(e) => setFormData({ ...formData, contractorType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., shipyard, module supplier"
                />
              </div>
            </div>

            <div>
              <label htmlFor="capabilities" className="block text-sm font-medium text-gray-700 mb-2">
                Capabilities (comma-separated)
              </label>
              <input
                type="text"
                id="capabilities"
                value={formData.capabilities}
                onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., pressure hull modules, final assembly"
              />
            </div>

            <div>
              <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 mb-2">
                Constraints (comma-separated)
              </label>
              <input
                type="text"
                id="constraints"
                value={formData.constraints}
                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., bottleneck, known issues"
              />
            </div>

            <div>
              <label htmlFor="productionRate" className="block text-sm font-medium text-gray-700 mb-2">
                Production Rate
              </label>
              <input
                type="text"
                id="productionRate"
                value={formData.productionRate}
                onChange={(e) => setFormData({ ...formData, productionRate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Free-text production rate"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Capacity Product'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
