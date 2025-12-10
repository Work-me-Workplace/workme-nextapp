'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Sparkles, ArrowLeft } from 'lucide-react'

export default function CreateInnovationPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    impactArea: '',
    maturityLevel: '',
    demoStatus: '',
    partners: '',
    benefits: '',
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
      const response = await api.post('/api/company/products/innovation/create', {
        name: formData.name,
        description: formData.description || null,
        impactArea: formData.impactArea || null,
        maturityLevel: formData.maturityLevel || null,
        demoStatus: formData.demoStatus || null,
        partners: formData.partners ? formData.partners.split(',').map(s => s.trim()).filter(Boolean) : [],
        benefits: formData.benefits ? formData.benefits.split(',').map(s => s.trim()).filter(Boolean) : [],
      })

      if (response.data.success) {
        router.push(`/company/products/innovation/${response.data.product.id}`)
      } else {
        alert('Failed to create innovation product: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create innovation product:', error)
      alert('Failed to create innovation product: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
          className="flex items-center text-purple-600 hover:text-purple-700 mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Sparkles className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Innovation Product</h1>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., AI-Powered Maintenance System"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Innovation description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="impactArea" className="block text-sm font-medium text-gray-700 mb-2">
                  Impact Area
                </label>
                <input
                  type="text"
                  id="impactArea"
                  value={formData.impactArea}
                  onChange={(e) => setFormData({ ...formData, impactArea: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., operations, training, maintenance"
                />
              </div>
              <div>
                <label htmlFor="maturityLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Maturity Level
                </label>
                <input
                  type="text"
                  id="maturityLevel"
                  value={formData.maturityLevel}
                  onChange={(e) => setFormData({ ...formData, maturityLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., TRL 6, Beta"
                />
              </div>
            </div>

            <div>
              <label htmlFor="demoStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Demo Status
              </label>
              <input
                type="text"
                id="demoStatus"
                value={formData.demoStatus}
                onChange={(e) => setFormData({ ...formData, demoStatus: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., In progress, Completed"
              />
            </div>

            <div>
              <label htmlFor="partners" className="block text-sm font-medium text-gray-700 mb-2">
                Partners (comma-separated)
              </label>
              <input
                type="text"
                id="partners"
                value={formData.partners}
                onChange={(e) => setFormData({ ...formData, partners: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Company A, Company B"
              />
            </div>

            <div>
              <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                Benefits (comma-separated)
              </label>
              <input
                type="text"
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Reduced downtime, Cost savings"
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
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Innovation Product'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
