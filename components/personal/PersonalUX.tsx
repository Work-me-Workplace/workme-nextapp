'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { CheckCircle2, Circle, User, Building2, Target, Code, X } from 'lucide-react'

interface OnboardingStatus {
  profile: boolean
  companyAffiliation: boolean
  goals: boolean
  skillSets: boolean
}

export default function PersonalUX() {
  const router = useRouter()
  const [status, setStatus] = useState<OnboardingStatus>({
    profile: false,
    companyAffiliation: false,
    goals: false,
    skillSets: false,
  })
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkOnboardingStatus()
    // Check if user has dismissed this before
    const dismissedState = localStorage.getItem('personalUX_dismissed')
    if (dismissedState === 'true') {
      setDismissed(true)
    }
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      setLoading(true)

      // Run all checks in parallel for faster loading
      const [profileRes, objectivesRes] = await Promise.allSettled([
        api.get('/api/workme/profile'),
        api.get('/api/objectives/list'),
      ])

      // Check profile (WorkProfile with headline and handle)
      let hasProfile = false
      let hasCompanyAffiliation = false
      if (profileRes.status === 'fulfilled') {
        const profile = profileRes.value.data.profile
        hasProfile = !!(profile?.headline && profile?.handle)
        // Check company affiliation from WorkProfile (companyUnitId)
        hasCompanyAffiliation = !!profile?.company?.id
      }

      // Check goals (Objectives)
      let hasGoals = false
      if (objectivesRes.status === 'fulfilled') {
        const objectives = objectivesRes.value.data.objectives || []
        hasGoals = objectives.length > 0
      }

      // Check skills (MySkills)
      let hasSkillSets = false
      try {
        const skillsRes = await api.get('/api/myskills')
        const mySkills = skillsRes.data.mySkills
        // Consider skills complete if at least one raw field is filled
        hasSkillSets = !!(
          mySkills?.mySkillsRaw ||
          mySkills?.myJobResponsibilitiesRaw ||
          mySkills?.myStrengthsRaw
        )
      } catch (err) {
        hasSkillSets = false
      }

      setStatus({
        profile: hasProfile,
        companyAffiliation: hasCompanyAffiliation,
        goals: hasGoals,
        skillSets: hasSkillSets,
      })
    } catch (error) {
      console.error('Failed to check onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('personalUX_dismissed', 'true')
  }

  // Don't show if dismissed
  if (dismissed) {
    return null
  }

  // Show loading skeleton while checking status
  if (loading) {
    return (
      <div className="mb-8 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mt-2 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Don't show if everything is complete
  const allComplete = Object.values(status).every(Boolean)
  if (allComplete) {
    return null
  }

  const items = [
    {
      key: 'profile',
      label: 'Profile',
      description: 'Add your headline and handle',
      path: '/profile',
      icon: User,
      complete: status.profile,
    },
    {
      key: 'companyAffiliation',
      label: 'Company',
      description: 'Set up your work affiliation',
      path: '/settings/company',
      icon: Building2,
      complete: status.companyAffiliation,
    },
    {
      key: 'goals',
      label: 'Goals',
      description: 'Define your career objectives',
      path: '/career',
      icon: Target,
      complete: status.goals,
    },
    {
      key: 'skillSets',
      label: 'Skills',
      description: 'Add your skill sets',
      path: '/career',
      icon: Code,
      complete: status.skillSets,
    },
  ]

  const incompleteCount = items.filter(item => !item.complete).length

  return (
    <div className="mb-8 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Personal Setup</h2>
            <p className="text-sm text-gray-600 mt-1">
              {incompleteCount > 0
                ? `${incompleteCount} item${incompleteCount > 1 ? 's' : ''} to complete`
                : 'All set!'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.path)}
                className={`relative p-4 rounded-lg border-2 transition-all text-left group ${
                  item.complete
                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${
                    item.complete ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-blue-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      item.complete ? 'text-green-600' : 'text-gray-600 group-hover:text-blue-600'
                    }`} />
                  </div>
                  {item.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 group-hover:text-blue-400 flex-shrink-0" />
                  )}
                </div>
                <h3 className={`font-semibold text-sm mb-1 ${
                  item.complete ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {item.label}
                </h3>
                <p className={`text-xs ${
                  item.complete ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {item.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

