'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import { getWorkMe, refreshWorkMe, type WorkMe } from '@/lib/workme.client'

export default function WelcomePage() {
  const router = useRouter()
  const [workMe, setWorkMe] = useState<WorkMe | null>(null)
  const [loading, setLoading] = useState(true)

  // Check Firebase auth - only redirect if not authenticated
  useEffect(() => {
    const firebaseUser = getAuth().currentUser
    if (!firebaseUser) {
      router.replace('/signin')
      return
    }
  }, [router])

  // Hydrate WorkMe identity once on mount
  useEffect(() => {
    const hydrateWorkMe = async () => {
      if (typeof window === 'undefined') return

      // Check if we already have WorkMe in localStorage
      const stored = getWorkMe()
      if (stored) {
        setWorkMe(stored)
        setLoading(false)
        return
      }

      // Fetch full WorkMe object from API
      try {
        const refreshed = await refreshWorkMe()
        if (refreshed) {
          setWorkMe(refreshed)
        }
      } catch (err) {
        console.error('Failed to hydrate WorkMe:', err)
      } finally {
        setLoading(false)
      }
    }

    hydrateWorkMe()
  }, [])

  // Don't auto-redirect - let user stay on welcome page and click continue
  // Like IgniteBD - "hold on welcome bro" - just show welcome, no yanking
  // Always go to dashboard - onboarding prompts will handle setup

  const handleContinue = () => {
    if (typeof window !== 'undefined') {
      const storedCompanyId = localStorage.getItem('companyId') || localStorage.getItem('companyUnit')
      const workMeCompanyId = workMe?.companyId || null
      const companyId = workMeCompanyId || storedCompanyId

      if (companyId) {
        localStorage.setItem('companyId', companyId)
        localStorage.setItem('companyUnit', companyId)
        router.push(`/mycompany/workforcestuff?companyId=${encodeURIComponent(companyId)}`)
        return
      }
    }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8 bg-white/10 backdrop-blur-sm rounded-2xl p-12 shadow-2xl border border-white/20">
        <div className="space-y-4">
          <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center">
            <svg className="h-16 w-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Welcome to Work.me!
          </h1>
          <p className="text-xl text-white/90">
            You are living inside your company. Everything else flows from that.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Career Building</h3>
            <p className="text-white/80 text-sm mb-4">Personal tools that support your growth.</p>
            <div className="space-y-2 text-white/90 text-sm">
              <Link href="/mywork/memos" className="block hover:text-white">Personal Blog</Link>
              <Link href="/mynetwork/connections" className="block hover:text-white">CRM</Link>
              <Link href="/mycareer/track" className="block hover:text-white">MySkills</Link>
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">My Work</h3>
            <p className="text-white/80 text-sm mb-4">Your outputs, tasks, and momentum.</p>
            <div className="space-y-2 text-white/90 text-sm">
              <Link href="/mywork/products" className="block hover:text-white">Work Products</Link>
              <Link href="/mywork/active" className="block hover:text-white">Stuff I’m Working On</Link>
              <Link href="/mywork/team" className="block hover:text-white">Team Members</Link>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-white/80 text-sm">
            Everything else is company work.
          </p>
          <button
            onClick={handleContinue}
            className="w-full bg-white text-blue-700 py-4 px-8 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg"
          >
            Go to Company Work →
          </button>
        </div>

        {workMe?.id && (
          <p className="text-white/60 text-sm">
            Account ID: {workMe.id.substring(0, 8)}...
          </p>
        )}
      </div>
    </div>
  )
}
