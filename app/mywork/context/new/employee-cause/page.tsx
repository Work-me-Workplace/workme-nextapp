'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createEmployeeCause } from '@/lib/actions/companyx-actions'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function NewEmployeeCausePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    partnerOrg: '',
    windowStart: '',
    windowEnd: '',
    location: '',
    neededItems: '',
    collectionPoints: '',
    signUpLink: '',
    pocFirstName: '',
    pocLastName: '',
    pocEmail: '',
    pocPhone: '',
    sponsoringDepartment: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!getWorkMeIdFromStorage()) {
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      // Parse comma-separated strings into arrays
      const neededItemsArray = formData.neededItems
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
      
      const collectionPointsArray = formData.collectionPoints
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)

      const result = await createEmployeeCause({
        title: formData.title,
        description: formData.description || null,
        partnerOrg: formData.partnerOrg || null,
        windowStart: formData.windowStart ? new Date(formData.windowStart + 'T00:00:00') : null,
        windowEnd: formData.windowEnd ? new Date(formData.windowEnd + 'T23:59:59') : null,
        location: formData.location || null,
        neededItems: neededItemsArray,
        collectionPoints: collectionPointsArray,
        signUpLink: formData.signUpLink || null,
        pocFirstName: formData.pocFirstName || null,
        pocLastName: formData.pocLastName || null,
        pocEmail: formData.pocEmail || null,
        pocPhone: formData.pocPhone || null,
        sponsoringDepartment: formData.sponsoringDepartment || null,
      })

      if (result.success && result.employeeCause) {
        router.push(`/mywork/context/${result.employeeCause.id}/success`)
      } else {
        alert('Failed to create Employee Cause: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating Employee Cause:', error)
      alert('Failed to create Employee Cause')
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
        <Link href="/mywork" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to WorkplaceSandbox
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Employee Cause</h2>

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
                placeholder="e.g., Annual Food Drive"
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
                placeholder="Brief description of the cause..."
              />
            </div>

            <div>
              <label htmlFor="partnerOrg" className="block text-sm font-medium text-gray-700 mb-2">
                Partner Organization
              </label>
              <input
                type="text"
                id="partnerOrg"
                value={formData.partnerOrg}
                onChange={(e) => setFormData({ ...formData, partnerOrg: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Partner organization name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="windowStart" className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Start
                </label>
                <input
                  type="date"
                  id="windowStart"
                  value={formData.windowStart}
                  onChange={(e) => setFormData({ ...formData, windowStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="windowEnd" className="block text-sm font-medium text-gray-700 mb-2">
                  Collection End
                </label>
                <input
                  type="date"
                  id="windowEnd"
                  value={formData.windowEnd}
                  onChange={(e) => setFormData({ ...formData, windowEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Physical location or virtual"
              />
            </div>

            <div>
              <label htmlFor="neededItems" className="block text-sm font-medium text-gray-700 mb-2">
                Needed Items (comma-separated)
              </label>
              <input
                type="text"
                id="neededItems"
                value={formData.neededItems}
                onChange={(e) => setFormData({ ...formData, neededItems: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., canned food, winter coats, toys"
              />
              <p className="mt-1 text-sm text-gray-500">Separate multiple items with commas</p>
            </div>

            <div>
              <label htmlFor="collectionPoints" className="block text-sm font-medium text-gray-700 mb-2">
                Collection Points (comma-separated)
              </label>
              <input
                type="text"
                id="collectionPoints"
                value={formData.collectionPoints}
                onChange={(e) => setFormData({ ...formData, collectionPoints: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Building 1 Lobby, Building 2 Reception"
              />
              <p className="mt-1 text-sm text-gray-500">Separate multiple locations with commas</p>
            </div>

            <div>
              <label htmlFor="signUpLink" className="block text-sm font-medium text-gray-700 mb-2">
                Sign Up Link
              </label>
              <input
                type="url"
                id="signUpLink"
                value={formData.signUpLink}
                onChange={(e) => setFormData({ ...formData, signUpLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="sponsoringDepartment" className="block text-sm font-medium text-gray-700 mb-2">
                Sponsoring Department
              </label>
              <input
                type="text"
                id="sponsoringDepartment"
                value={formData.sponsoringDepartment}
                onChange={(e) => setFormData({ ...formData, sponsoringDepartment: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Department or office name"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Point of Contact</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pocFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                    POC First Name
                  </label>
                  <input
                    type="text"
                    id="pocFirstName"
                    value={formData.pocFirstName}
                    onChange={(e) => setFormData({ ...formData, pocFirstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="pocEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    POC Email
                  </label>
                  <input
                    type="email"
                    id="pocEmail"
                    value={formData.pocEmail}
                    onChange={(e) => setFormData({ ...formData, pocEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="pocPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    POC Phone (optional)
                  </label>
                  <input
                    type="tel"
                    id="pocPhone"
                    value={formData.pocPhone}
                    onChange={(e) => setFormData({ ...formData, pocPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Employee Cause'}
              </button>
              <Link
                href="/mywork"
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

