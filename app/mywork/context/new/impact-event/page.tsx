'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createImpactEvent } from '@/lib/actions/typed-contexts'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId'

export default function NewImpactEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    effectiveDate: '',
    impactedPopulation: '',
    urgency: '',
    pocLastName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!getWorkMeIdFromStorage()) {
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      const result = await createImpactEvent({
        title: formData.title,
        description: formData.description || null,
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : null,
        impactedPopulation: formData.impactedPopulation || null,
        urgency: formData.urgency || null,
        pocLastName: formData.pocLastName || null,
      })

      if (result.success && result.workContext) {
        router.push(`/mywork/context/${result.workContext.id}`)
      } else {
        alert('Failed to create Impact Event: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating Impact Event:', error)
      alert('Failed to create Impact Event')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/mywork/context/new" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to Context Types
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Impact Event</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date
              </label>
              <input
                type="datetime-local"
                id="effectiveDate"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="impactedPopulation" className="block text-sm font-medium text-gray-700 mb-2">
                Impacted Population
              </label>
              <input
                type="text"
                id="impactedPopulation"
                value={formData.impactedPopulation}
                onChange={(e) => setFormData({ ...formData, impactedPopulation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                Urgency
              </label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select urgency</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="pocLastName" className="block text-sm font-medium text-gray-700 mb-2">
                POC Last Name
              </label>
              <input
                type="text"
                id="pocLastName"
                value={formData.pocLastName}
                onChange={(e) => setFormData({ ...formData, pocLastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Impact Event'}
              </button>
              <Link
                href="/mywork/context/new"
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

