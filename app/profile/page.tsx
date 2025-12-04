'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import WorkspaceUnit from '@/components/profile/WorkspaceUnit'

type Step = 'profile' | 'workspace'

export default function ProfilePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('profile')
  const [loading, setLoading] = useState(false)
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  
  // WorkProfile data (personal identity only - like GoFast Athlete profile)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    currentRole: '',
    handle: '',
    linkedinUrl: '',
    profileImage: '',
  })

  // Workspace data (separate - WorkEntry)
  const [unitName, setUnitName] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('workMeId')
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
      loadProfile()
    }
  }, [router])

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/workme/profile')
      if (response.data?.profile) {
        const profile = response.data.profile
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          headline: profile.headline || '',
          currentRole: profile.currentRole || '',
          handle: profile.handle || '',
          linkedinUrl: profile.linkedinUrl || '',
          profileImage: profile.profileImage || '',
        })
      }
      
      // Load company affiliation separately (WorkEntry)
      try {
        const workEntriesRes = await api.get('/api/work-entry/list')
        const workEntries = workEntriesRes.data.workEntries || []
        const currentEntry = workEntries.find((e: any) => !e.endDate)
        if (currentEntry?.companyUnit?.name) {
          setUnitName(currentEntry.companyUnit.name)
        }
      } catch (err) {
        // No work entry yet
      }
    } catch (error) {
      console.log('Profile not loaded (new user):', error)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workMeId || loading) return

    // Validate required fields (headline and handle for PersonalUX check)
    if (!formData.headline.trim() || !formData.handle.trim()) {
      alert('Please fill in headline and handle (required for profile completion)')
      return
    }

    setLoading(true)
    try {
      // Update WorkProfile (personal identity only)
      await api.put('/api/workme/profile', {
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        headline: formData.headline || null,
        currentRole: formData.currentRole || null,
        handle: formData.handle,
        linkedinUrl: formData.linkedinUrl || null,
        profileImage: formData.profileImage || null,
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

        {/* Step 1: Personal Profile (WorkProfile - like GoFast Athlete) */}
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

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Headline *
              </label>
              <input
                type="text"
                required
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. Marketing Manager | Growth Strategist"
              />
              <p className="text-xs text-white/60 mt-1">LinkedIn-style professional headline</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Handle (Username) *
              </label>
              <input
                type="text"
                required
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. johndoe"
              />
              <p className="text-xs text-white/60 mt-1">Unique username for your profile (letters, numbers, and underscores only)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Current Role (Optional)
              </label>
              <input
                type="text"
                value={formData.currentRole}
                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. Senior Marketing Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                LinkedIn URL (Optional)
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Profile Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="https://example.com/your-photo.jpg"
              />
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
              onSubmit={() => {}}
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
