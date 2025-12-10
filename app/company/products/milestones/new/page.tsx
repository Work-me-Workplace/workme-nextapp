'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Calendar, ArrowLeft, Loader2 } from 'lucide-react'

export default function CreateMilestonePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platformUnitId = searchParams.get('platformUnitId')
  const platformProductId = searchParams.get('platformProductId')

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    milestoneType: 'PRODUCT',
    platformUnitId: platformUnitId || '',
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
    if (!formData.title) {
      alert('Title is required')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/api/company/products/milestones/create', {
        ...formData,
        platformUnitId: formData.platformUnitId || null,
        date: formData.date || null,
      })

      if (response.data.success) {
        if (platformUnitId) {
          router.push(`/company/products/platform/unit/${platformUnitId}`)
        } else if (platformProductId) {
          router.push(`/company/products/platform/${platformProductId}`)
        } else {
          router.push('/company/products')
        }
      } else {
        alert('Failed to create milestone: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create milestone:', error)
      alert('Failed to create milestone: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
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
          href={platformUnitId ? `/company/products/platform/unit/${platformUnitId}` : '/company/products'}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Create Milestone</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Keel Laying, Delivery, Commissioning"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Milestone description..."
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="milestoneType" className="block text-sm font-medium text-gray-700 mb-2">
                Milestone Type
              </label>
              <select
                id="milestoneType"
                value={formData.milestoneType}
                onChange={(e) => setFormData({ ...formData, milestoneType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PRODUCT">Product</option>
                <option value="WORKFORCE">Workforce</option>
                <option value="INNOVATION">Innovation</option>
              </select>
            </div>

            {formData.milestoneType === 'PRODUCT' && (
              <div>
                <label htmlFor="platformUnitId" className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Unit (optional)
                </label>
                <input
                  type="text"
                  id="platformUnitId"
                  value={formData.platformUnitId}
                  onChange={(e) => setFormData({ ...formData, platformUnitId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Unit ID (if linking to a specific unit)"
                  disabled={!!platformUnitId}
                />
                {platformUnitId && (
                  <p className="text-xs text-gray-500 mt-1">Linked to current unit</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end space-x-4">
              <Link
                href={platformUnitId ? `/company/products/platform/unit/${platformUnitId}` : '/company/products'}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Milestone'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
