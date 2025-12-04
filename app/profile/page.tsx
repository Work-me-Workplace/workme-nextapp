'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
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
          profileImage: profile.profileImage || '', // Will be auto-populated from Firebase if empty
        })
      }
    } catch (error) {
      console.log('Profile not loaded (new user):', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workMeId || loading) return

    // Validate required fields (headline and handle for PersonalUX check)
    if (!formData.headline.trim() || !formData.handle.trim()) {
      alert('Please fill in headline and handle (required for profile completion)')
      return
    }

    setLoading(true)
    try {
      // Update WorkProfile (personal identity only) - matches API route exactly
      await api.put('/api/workme/profile', {
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        headline: formData.headline || null,
        currentRole: formData.currentRole || null,
        handle: formData.handle,
        linkedinUrl: formData.linkedinUrl || null,
        profileImage: formData.profileImage || null,
      })

      // Redirect to dashboard after save
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg p-8 shadow-lg border-2 border-sky-500">
        {/* Header with icon */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-100 rounded-full mb-4">
            <User className="h-8 w-8 text-sky-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Profile
          </h1>
          <p className="text-gray-600">
            Update your personal information
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Headline *
            </label>
            <input
              type="text"
              required
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="e.g. Marketing Manager | Growth Strategist"
            />
            <p className="text-xs text-gray-500 mt-1">LinkedIn-style professional headline</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Handle (Username) *
            </label>
            <input
              type="text"
              required
              value={formData.handle}
              onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="e.g. johndoe"
            />
            <p className="text-xs text-gray-500 mt-1">Unique username for your profile (letters, numbers, and underscores only)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Role (Optional)
            </label>
            <input
              type="text"
              value={formData.currentRole}
              onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="e.g. Senior Marketing Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn URL (Optional)
            </label>
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.profileImage}
              onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="Leave empty to use your Firebase profile photo"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Firebase profile photo will be used automatically if left empty
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-sky-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
