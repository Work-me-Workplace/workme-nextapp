'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'

interface OnboardingStatus {
  profile: boolean
  companyAffiliation: boolean
  goals: boolean
  skillSets: boolean
}

export default function OnboardingPrompt() {
  const router = useRouter()
  const [status, setStatus] = useState<OnboardingStatus>({
    profile: false,
    companyAffiliation: false,
    goals: false,
    skillSets: false,
  })
  const [loading, setLoading] = useState(true)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      setLoading(true)

      // Check profile
      const profileRes = await api.get('/api/workme/profile')
      const profile = profileRes.data.profile
      const hasProfile = !!(profile?.headline && profile?.handle)

      // Check work entries (company affiliation)
      const workEntriesRes = await api.get('/api/work-entry/list')
      const workEntries = workEntriesRes.data.workEntries || []
      const hasCompanyAffiliation = workEntries.length > 0

      // Goals and skill sets - placeholder for now (always false)
      const hasGoals = false
      const hasSkillSets = false

      const newStatus = {
        profile: hasProfile,
        companyAffiliation: hasCompanyAffiliation,
        goals: hasGoals,
        skillSets: hasSkillSets,
      }

      setStatus(newStatus)

      // Show prompt if anything is incomplete
      const allComplete = Object.values(newStatus).every(Boolean)
      setShowPrompt(!allComplete)
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !showPrompt) {
    return null
  }

  const incompleteItems = [
    { key: 'profile', label: 'Create Your Profile', path: '/profile', complete: status.profile },
    { key: 'companyAffiliation', label: 'Set Up Company Affiliation', path: '/profile', complete: status.companyAffiliation },
    { key: 'goals', label: 'Set Up Goals', path: '/career', complete: status.goals },
    { key: 'skillSets', label: 'Set Up Skill Sets', path: '/career', complete: status.skillSets },
  ].filter(item => !item.complete)

  if (incompleteItems.length === 0) {
    return null
  }

  return (
    <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Complete Your Setup
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Finish setting up your profile to get the most out of Work.me
          </p>

          <div className="space-y-2">
            {incompleteItems.map((item) => (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-50 transition border border-gray-200 hover:border-blue-300 group"
              >
                <div className="flex items-center space-x-3">
                  <Circle className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowPrompt(false)}
          className="ml-4 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

