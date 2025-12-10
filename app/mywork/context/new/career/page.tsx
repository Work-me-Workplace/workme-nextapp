'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createCareer } from '@/lib/actions/companyx'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

interface Deadline {
  label: string
  date: string
}

export default function NewCareerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadlines: [] as Deadline[],
    supervisorName: '',
    resourceLink: '',
    pocFirstName: '',
    pocLastName: '',
    pocEmail: '',
    pocPhone: '',
    pocDepartment: '',
  })

  const addDeadline = () => {
    setFormData({
      ...formData,
      deadlines: [...formData.deadlines, { label: '', date: '' }],
    })
  }

  const removeDeadline = (index: number) => {
    setFormData({
      ...formData,
      deadlines: formData.deadlines.filter((_, i) => i !== index),
    })
  }

  const updateDeadline = (index: number, field: 'label' | 'date', value: string) => {
    const updated = [...formData.deadlines]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, deadlines: updated })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!getWorkMeIdFromStorage()) {
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      // Convert deadlines to Date objects
      const deadlinesWithDates = formData.deadlines
        .filter(d => d.label && d.date)
        .map(d => ({
          label: d.label,
          date: new Date(d.date + 'T23:59:59'),
        }))

      const result = await createCareer({
        title: formData.title,
        description: formData.description || null,
        deadlines: deadlinesWithDates.length > 0 ? deadlinesWithDates : null,
        supervisorName: formData.supervisorName || null,
        resourceLink: formData.resourceLink || null,
        pocFirstName: formData.pocFirstName || null,
        pocLastName: formData.pocLastName || null,
        pocEmail: formData.pocEmail || null,
        pocPhone: formData.pocPhone || null,
        pocDepartment: formData.pocDepartment || null,
      })

      if (result.success && result.career) {
        router.push(`/mywork/context/${result.career.id}/success`)
      } else {
        alert('Failed to create Career Context: ' + (result.error || 'Unknown error'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Error creating Career Context:', error)
      alert('Failed to create Career Context')
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Company Career Context</h2>
          <p className="text-gray-600 mb-6">For performance reviews, assessment cycles, career development activities, etc.</p>

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
                placeholder="e.g., FY25 AcqDemo CCAS Assessment Cycle"
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
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the career/assessment activity..."
              />
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Deadlines</h3>
                <button
                  type="button"
                  onClick={addDeadline}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  + Add Deadline
                </button>
              </div>

              {formData.deadlines.length === 0 ? (
                <p className="text-sm text-gray-500 mb-4">No deadlines added yet. Click "Add Deadline" to add one.</p>
              ) : (
                <div className="space-y-4">
                  {formData.deadlines.map((deadline, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-start p-4 border border-gray-200 rounded-lg">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Label
                        </label>
                        <input
                          type="text"
                          value={deadline.label}
                          onChange={(e) => updateDeadline(index, 'label', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Employee Self-Assessment"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={deadline.date}
                          onChange={(e) => updateDeadline(index, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeDeadline(index)}
                          className="w-full px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="supervisorName" className="block text-sm font-medium text-gray-700 mb-2">
                Supervisor Name (optional)
              </label>
              <input
                type="text"
                id="supervisorName"
                value={formData.supervisorName}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Supervisor name if applicable"
              />
            </div>

            <div>
              <label htmlFor="resourceLink" className="block text-sm font-medium text-gray-700 mb-2">
                Resource Link
              </label>
              <input
                type="url"
                id="resourceLink"
                value={formData.resourceLink}
                onChange={(e) => setFormData({ ...formData, resourceLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
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

              <div className="mt-4">
                <label htmlFor="pocDepartment" className="block text-sm font-medium text-gray-700 mb-2">
                  POC Department
                </label>
                <input
                  type="text"
                  id="pocDepartment"
                  value={formData.pocDepartment}
                  onChange={(e) => setFormData({ ...formData, pocDepartment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Department or office name"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Career Context'}
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
