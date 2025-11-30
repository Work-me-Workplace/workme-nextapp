'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'

export default function SetupUnitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const needsUnit = searchParams.get('needsUnit') === 'true'

  const [companyUnit, setCompanyUnit] = useState('')
  const [companyDivision, setCompanyDivision] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!companyUnit.trim()) {
      setError('Company unit is required')
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/api/user/update', {
        companyUnit: companyUnit.trim(),
        companyDivision: companyDivision.trim() || null,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update user')
      }

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('companyUnit', companyUnit.trim())
        if (companyDivision.trim()) {
          localStorage.setItem('companyDivision', companyDivision.trim())
        }
      }

      // Redirect to dashboard or home
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Failed to update company unit:', err)
      setError(err.message || 'Failed to save. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Your Work Unit
          </h1>
          <p className="text-gray-600">
            {needsUnit 
              ? 'You need to set a company unit before creating work items.'
              : 'Tell us which unit you work in.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="companyUnit" className="block text-sm font-medium text-gray-700 mb-2">
              Company Unit <span className="text-red-500">*</span>
            </label>
            <input
              id="companyUnit"
              type="text"
              value={companyUnit}
              onChange={(e) => setCompanyUnit(e.target.value)}
              placeholder="e.g., NAVSEA, SEA 02, Engineering"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              This is required for creating work items and organizing your work.
            </p>
          </div>

          <div>
            <label htmlFor="companyDivision" className="block text-sm font-medium text-gray-700 mb-2">
              Company Division <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              id="companyDivision"
              type="text"
              value={companyDivision}
              onChange={(e) => setCompanyDivision(e.target.value)}
              placeholder="e.g., Operations, Development, Support"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional grouping layer for organizing work within your unit.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !companyUnit.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

