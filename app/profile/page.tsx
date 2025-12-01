'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { jobRoleOptions, salaryRangeOptions } from '@/lib/config/profileConfig'
import WorkspaceUnit from '@/components/profile/WorkspaceUnit'

type Step = 'profile' | 'workspace'

export default function ProfilePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(false)
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  
  // Profile data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    jobRole: '',
    specialty: '',
    industry: '',
    salaryRange: '',
    photoUrl: '',
  })

  // Workspace data
  const [unitName, setUnitName] = useState('')

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
          firstName: workMe.firstName || '',
          lastName: workMe.lastName || '',
          jobTitle: workMe.jobTitle || '',
          jobRole: workMe.jobRole || '',
          specialty: workMe.specialty || '',
          industry: workMe.industry || '',
          salaryRange: workMe.salaryRange || '',
          photoUrl: workMe.photoUrl || '',
        })
        setUnitName(workMe.companyUnit || '')
      }
    } catch (error) {
      console.log('Profile not loaded (new user):', error)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workMeId || loading) return

    // Validate required fields
    if (!formData.jobTitle.trim() || !formData.jobRole) {
      alert('Please fill in all required fields (Job Title and Role Level)')
      return
    }

    setLoading(true)
    try {
      // Update basic profile
      await api.put('/api/workme/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitle,
        jobRole: formData.jobRole,
        specialty: formData.specialty || null,
        industry: formData.industry || null,
        salaryRange: formData.salaryRange || null,
        photoUrl: formData.photoUrl || null,
      })

      // Move to workspace step
      setCurrentStep('workspace')
    } catch (error: any) {
      console.error('Profile update failed:', error)
      alert(`Failed to update profile: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workMeId || loading) return

    setLoading(true)
    try {
      // Set workspace (companyUnit) via registry
      const response = await api.post('/api/workme/companyunit', {
        unitName: unitName.trim() || null,
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to set workspace')
      }

      // Update localStorage
      if (typeof window !== 'undefined') {
        const finalUnitName = response.data.unitName
        localStorage.setItem('companyUnit', finalUnitName)
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Workspace setup failed:', error)
      alert(`Failed to set workspace: ${error.message || 'Please try again.'}`)
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

  const steps: { key: Step; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'workspace', label: 'Workspace' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      index <= currentStepIndex
                        ? 'bg-white text-blue-700'
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-xs mt-2 ${index <= currentStepIndex ? 'text-white' : 'text-white/60'}`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      index < currentStepIndex ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentStep === 'profile' && 'Complete Your Profile'}
            {currentStep === 'workspace' && 'Choose Your Workspace'}
          </h1>
          <p className="text-white/80">
            {currentStep === 'profile' && 'Tell us about yourself to get started'}
            {currentStep === 'workspace' && 'Select or create your workspace'}
          </p>
        </div>

        {/* Step 1: Basic Profile */}
        {currentStep === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Doe"
                />
              </div>
            </div>

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
                  {jobRoleOptions.map((role) => (
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
                {salaryRangeOptions.map((range) => (
                  <option key={range.value} value={range.value} className="text-gray-900">
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-blue-700 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Next →'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Workspace Selection */}
        {currentStep === 'workspace' && (
          <form onSubmit={handleWorkspaceSubmit} className="space-y-6">
            <WorkspaceUnit
              unitName={unitName}
              onUnitNameChange={setUnitName}
              onSubmit={handleWorkspaceSubmit}
              loading={loading}
            />

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep('profile')}
                className="flex-1 bg-white/10 text-white py-3 px-6 rounded-xl font-semibold hover:bg-white/20 transition border border-white/30"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-blue-700 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Setup →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
