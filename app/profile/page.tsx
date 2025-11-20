'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

const jobRoles = [
  { value: 'INDIVIDUAL_CONTRIBUTOR', label: 'Individual Contributor' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DIRECTOR_LEVEL', label: 'Director Level' },
  { value: 'PROJECT_LEAD', label: 'Project Lead' },
]

const salaryRanges = [
  { value: 'BELOW_50K', label: 'Below $50K' },
  { value: 'K50_100K', label: '$50K - $100K' },
  { value: 'K100_150K', label: '$100K - $150K' },
  { value: 'K150_200K', label: '$150K - $200K' },
  { value: 'ABOVE_200K', label: 'Above $200K' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    jobTitle: '',
    specialty: '',
    industry: '',
    jobRole: '',
    annualSalary: '',
    salaryRange: '',
    workLocation: '',
    city: '',
    state: '',
    companyName: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('workMeId')
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
      loadProfile(id)
    }
  }, [router])

  const loadProfile = async (id: string) => {
    try {
      const response = await api.get(`/api/workme/profile?workMeId=${id}`)
      if (response.data?.workMe) {
        const workMe = response.data.workMe
        setFormData({
          jobTitle: workMe.jobTitle || '',
          specialty: workMe.specialty || '',
          industry: workMe.industry || '',
          jobRole: workMe.jobRole || '',
          annualSalary: workMe.annualSalary || '',
          salaryRange: workMe.salaryRange || '',
          workLocation: workMe.workLocation || '',
          city: workMe.city || '',
          state: workMe.state || '',
          companyName: workMe.company?.name || '',
        })
      }
    } catch (error) {
      // Profile might not exist yet, that's okay
      console.log('Profile not loaded (new user):', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workMeId || loading) return

    setLoading(true)
    try {
      // Update profile first
      await api.put('/api/workme/profile', {
        workMeId,
        jobTitle: formData.jobTitle,
        specialty: formData.specialty,
        industry: formData.industry,
        jobRole: formData.jobRole,
        annualSalary: formData.annualSalary,
        salaryRange: formData.salaryRange,
        workLocation: formData.workLocation,
        city: formData.city,
        state: formData.state,
      })

      // If company name provided, upsert company (just name for now, enrichment later)
      if (formData.companyName.trim()) {
        await api.put('/api/workme/company', {
          workMeId,
          companyName: formData.companyName.trim(),
          // No companyData - just upsert with name, leave other fields nullable
        })
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Profile update failed:', error)
      alert(`Failed to update profile: ${error.message || 'Please try again.'}`)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-white/80">
            Tell us about your career to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. Marketing Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Role Level *
              </label>
              <select
                required
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">Select role level</option>
                {jobRoles.map((role) => (
                  <option key={role.value} value={role.value} className="text-gray-900">
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Specialty
              </label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. Digital Marketing, Product Design"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. Technology, Healthcare"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Salary Range
              </label>
              <select
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">Select range</option>
                {salaryRanges.map((range) => (
                  <option key={range.value} value={range.value} className="text-gray-900">
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Annual Salary
              </label>
              <input
                type="text"
                value={formData.annualSalary}
                onChange={(e) => setFormData({ ...formData, annualSalary: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. $75,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Work Location
            </label>
            <input
              type="text"
              value={formData.workLocation}
              onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="e.g. Remote, Hybrid, Office"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Company
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="e.g. Acme Corp, Google, Starbucks"
            />
            <p className="mt-1 text-xs text-white/60">
              Company details will be enriched automatically
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. San Francisco"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. CA"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-blue-700 py-4 px-6 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

