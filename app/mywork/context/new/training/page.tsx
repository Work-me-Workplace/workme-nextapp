'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createTraining } from '@/lib/actions/companyx'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function NewTrainingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trainingDate: '',
    trainingTime: '',
    deadline: '',
    deadlineTime: '',
    link: '',
    mandatory: false,
    sponsoringOffice: '',
    pocFirstName: '',
    pocLastName: '',
    pocEmail: '',
    pocPhone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!getWorkMeIdFromStorage()) {
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      const result = await createTraining({
        title: formData.title,
        description: formData.description || null,
        trainingDate: formData.trainingDate && formData.trainingTime 
          ? new Date(`${formData.trainingDate}T${formData.trainingTime}`)
          : formData.trainingDate 
          ? new Date(formData.trainingDate + 'T00:00:00')
          : null,
        deadline: formData.deadline && formData.deadlineTime 
          ? new Date(`${formData.deadline}T${formData.deadlineTime}`)
          : formData.deadline 
          ? new Date(formData.deadline + 'T23:59:59')
          : null,
        link: formData.link || null,
        mandatory: formData.mandatory,
        sponsoringOffice: formData.sponsoringOffice || null,
        pocFirstName: formData.pocFirstName || null,
        pocLastName: formData.pocLastName || null,
        pocEmail: formData.pocEmail || null,
        pocPhone: formData.pocPhone || null,
      })

      if (result.success && result.training) {
        router.push(`/mywork/context/${result.training.id}/success`)
      } else {
        alert('Failed to create Training: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating Training:', error)
      alert('Failed to create Training')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Training</h2>

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

            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="trainingDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Training Date
                </label>
                <input
                    type="date"
                  id="trainingDate"
                  value={formData.trainingDate}
                  onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

                <div>
                  <label htmlFor="trainingTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Training Time
                  </label>
                  <input
                    type="time"
                    id="trainingTime"
                    value={formData.trainingTime}
                    onChange={(e) => setFormData({ ...formData, trainingTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                    type="date"
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

                <div>
                  <label htmlFor="deadlineTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline Time
                  </label>
                  <input
                    type="time"
                    id="deadlineTime"
                    value={formData.deadlineTime}
                    onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                Link
              </label>
              <input
                type="url"
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label htmlFor="sponsoringOffice" className="block text-sm font-medium text-gray-700 mb-2">
                Sponsoring Office
              </label>
              <input
                type="text"
                id="sponsoringOffice"
                value={formData.sponsoringOffice}
                onChange={(e) => setFormData({ ...formData, sponsoringOffice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
                <input
                  type="checkbox"
                id="mandatory"
                  checked={formData.mandatory}
                  onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              <label htmlFor="mandatory" className="ml-2 block text-sm text-gray-700">
                Mandatory training
              </label>
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
                {loading ? 'Creating...' : 'Create Training'}
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
