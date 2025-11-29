'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBenefits } from '@/lib/actions/companyx-actions'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function NewBenefitsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    windowStart: '',
    windowEnd: '',
    fehbLink: '',
    fedvipLink: '',
    fsafedsLink: '',
    faqLink: '',
    pocFirstName: '',
    pocLastName: '',
    pocEmail: '',
    pocPhone: '',
    pocDepartment: '',
    annualRecurrence: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!getWorkMeIdFromStorage()) {
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      const result = await createBenefits({
        title: formData.title,
        description: formData.description || null,
        windowStart: formData.windowStart ? new Date(formData.windowStart + 'T00:00:00') : null,
        windowEnd: formData.windowEnd ? new Date(formData.windowEnd + 'T23:59:59') : null,
        fehbLink: formData.fehbLink || null,
        fedvipLink: formData.fedvipLink || null,
        fsafedsLink: formData.fsafedsLink || null,
        faqLink: formData.faqLink || null,
        pocFirstName: formData.pocFirstName || null,
        pocLastName: formData.pocLastName || null,
        pocEmail: formData.pocEmail || null,
        pocPhone: formData.pocPhone || null,
        pocDepartment: formData.pocDepartment || null,
        annualRecurrence: formData.annualRecurrence,
      })

      if (result.success && result.benefits) {
        router.push(`/mywork/context/${result.benefits.id}/success`)
      } else {
        alert('Failed to create Benefits: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating Benefits Context:', error)
      alert('Failed to create Benefits Context')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Company Benefits Context</h2>
          <p className="text-gray-600 mb-6">For benefits enrollment windows like Open Season, FSA enrollment, etc.</p>

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
                placeholder="e.g., Open Season 2025"
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
                placeholder="Brief description of the benefits enrollment window..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="windowStart" className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Start
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
                  Enrollment End
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

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Links</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="fehbLink" className="block text-sm font-medium text-gray-700 mb-2">
                    FEHB Link
                  </label>
                  <input
                    type="url"
                    id="fehbLink"
                    value={formData.fehbLink}
                    onChange={(e) => setFormData({ ...formData, fehbLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="fedvipLink" className="block text-sm font-medium text-gray-700 mb-2">
                    FEDVIP Link
                  </label>
                  <input
                    type="url"
                    id="fedvipLink"
                    value={formData.fedvipLink}
                    onChange={(e) => setFormData({ ...formData, fedvipLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="fsafedsLink" className="block text-sm font-medium text-gray-700 mb-2">
                    FSAFEDS Link
                  </label>
                  <input
                    type="url"
                    id="fsafedsLink"
                    value={formData.fsafedsLink}
                    onChange={(e) => setFormData({ ...formData, fsafedsLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="faqLink" className="block text-sm font-medium text-gray-700 mb-2">
                    FAQ Link
                  </label>
                  <input
                    type="url"
                    id="faqLink"
                    value={formData.faqLink}
                    onChange={(e) => setFormData({ ...formData, faqLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
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

              <div className="mt-4">
                <label htmlFor="pocDepartment" className="block text-sm font-medium text-gray-700 mb-2">
                  POC Department (optional)
                </label>
                <input
                  type="text"
                  id="pocDepartment"
                  value={formData.pocDepartment}
                  onChange={(e) => setFormData({ ...formData, pocDepartment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., HR Benefits"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="annualRecurrence"
                checked={formData.annualRecurrence}
                onChange={(e) => setFormData({ ...formData, annualRecurrence: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="annualRecurrence" className="ml-2 block text-sm text-gray-700">
                Annual recurrence (e.g., Open Season happens every year)
              </label>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Benefits Context'}
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

