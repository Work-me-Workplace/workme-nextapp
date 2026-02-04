'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Calendar, ArrowLeft, Loader2 } from 'lucide-react'

function CreateMilestoneForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platformUnitId = searchParams.get('platformUnitId')

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    milestoneType: '',
    category: '',
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
        title: formData.title,
        description: formData.description || null,
        date: formData.date || null,
        milestoneType: formData.milestoneType || null,
        category: formData.category || null,
        platformUnitId: formData.platformUnitId || null, // Optional - only for HUGE company-wide events
      })

      if (response.data.success) {
        if (platformUnitId) {
          router.push(`/company/products/platform/unit/${platformUnitId}`)
        } else {
          router.push('/mycompany/milestones')
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
          href={platformUnitId ? `/company/products/platform/unit/${platformUnitId}` : '/mycompany/milestones'}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Company Milestone</h1>
              <p className="text-sm text-gray-600 mt-1">
                Big picture company-wide milestones. For routine unit events (keel laying, delivery, etc.), use{' '}
                <Link href="/mycompany/platforms/updates" className="text-blue-600 hover:text-blue-700 underline">
                  Platform Unit Updates
                </Link>
                . Only use this for HUGE company-wide events (e.g., "Carrier flew its first mission").
              </p>
            </div>
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
                placeholder="e.g., Major Company Reorganization"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                <option value="BUSINESS">Business</option>
                <option value="STRATEGY">Strategy</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="REORGANIZATION">Reorganization</option>
                <option value="MERGER">Merger</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            <div>
              <label htmlFor="milestoneType" className="block text-sm font-medium text-gray-700 mb-2">
                Milestone Type
              </label>
              <input
                type="text"
                id="milestoneType"
                value={formData.milestoneType}
                onChange={(e) => setFormData({ ...formData, milestoneType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Major Contract Award, Strategic Initiative"
              />
            </div>

            <div>
              <label htmlFor="platformUnitId" className="block text-sm font-medium text-gray-700 mb-2">
                Platform Unit ID (Optional - Only for HUGE company-wide events involving a specific unit)
              </label>
              <input
                type="text"
                id="platformUnitId"
                value={formData.platformUnitId}
                onChange={(e) => setFormData({ ...formData, platformUnitId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Only if this is a massive company-wide event like 'Carrier flew first mission'"
                disabled={!!platformUnitId}
              />
              {platformUnitId && (
                <p className="text-xs text-gray-500 mt-1">Linked to unit - only use for HUGE company-wide events</p>
              )}
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

            <div className="flex items-center justify-end space-x-4">
              <Link
                href={platformUnitId ? `/company/products/platform/unit/${platformUnitId}` : '/mycompany/milestones'}
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

export default function CreateMilestonePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CreateMilestoneForm />
    </Suspense>
  )
}
