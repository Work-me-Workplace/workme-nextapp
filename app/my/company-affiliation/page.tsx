'use client'

import { useState } from 'react'
import api from '@/lib/api'

export default function CompanyAffiliationPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    unitName: '',
    divisionName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await api.post('/api/company-affiliation/save', {
        companyName: formData.companyName,
        unitName: formData.unitName,
        divisionName: formData.divisionName,
      })

      if (response.data.success) {
        setMessage('✅ Affiliation saved successfully!')
        
        // Clear form
        setFormData({
          companyName: '',
          unitName: '',
          divisionName: '',
        })
      } else {
        setMessage(`❌ Error: ${response.data.error || 'Failed to save'}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.response?.data?.error || error.message || 'Failed to save'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Company Affiliation
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company HQ Name
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company HQ name"
            />
          </div>

          <div>
            <label htmlFor="unitName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Unit Name
            </label>
            <input
              type="text"
              id="unitName"
              value={formData.unitName}
              onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company unit name"
            />
          </div>

          <div>
            <label htmlFor="divisionName" className="block text-sm font-medium text-gray-700 mb-2">
              Division Name
            </label>
            <input
              type="text"
              id="divisionName"
              value={formData.divisionName}
              onChange={(e) => setFormData({ ...formData, divisionName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter division name"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg ${
              message.startsWith('✅') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

