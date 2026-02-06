'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getWorkMe, refreshWorkMe, type WorkMe } from '@/lib/workme.client'

export default function WelcomePage() {
  const router = useRouter()
  const [workMe, setWorkMe] = useState<WorkMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)

  // Hydrate WorkMe identity using Firebase ID lookup (like GoFast pattern)
  const hydrateWorkMe = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (hasHydrated) {
      console.log('⚠️ Welcome: Already hydrated, skipping...')
      return
    }

    try {
      setHasHydrated(true)
      
      // Check if we already have WorkMe in localStorage
      const stored = getWorkMe()
      if (stored) {
        console.log('✅ Welcome: Using stored WorkMe from localStorage')
        setWorkMe(stored)
        setLoading(false)
        return
      }

      // Fetch full WorkMe object from API (uses Firebase ID from token)
      console.log('🚀 Welcome: Hydrating WorkMe data...')
      const refreshed = await refreshWorkMe()
      if (refreshed) {
        console.log('✅ Welcome: WorkMe hydrated:', refreshed.id)
        setWorkMe(refreshed)
        setLoading(false)
      } else {
        console.error('❌ Welcome: Failed to hydrate WorkMe')
        // Don't redirect immediately - let user see the page
        setLoading(false)
      }
    } catch (err: any) {
      console.error('❌ Welcome: Hydration error:', err)
      setHasHydrated(false) // Reset so we can retry
      setLoading(false)
      
      // Only redirect on auth errors - other errors let user stay on page
      if (err.response?.status === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        console.log('🚫 Welcome: Unauthorized → redirecting to signin')
        router.push('/signin')
        return
      }
      // For other errors, don't redirect - let user try again
    }
  }, [router, hasHydrated])

  // CRITICAL: Wait for Firebase auth to initialize using onAuthStateChanged
  // DO NOT check auth.currentUser directly - it will be null on page refresh!
  useEffect(() => {
    if (!auth) {
      console.error('❌ Welcome: Firebase auth not initialized')
      router.push('/signin')
      return
    }

    let hasRun = false // Guard to prevent multiple runs
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (hasRun) {
        console.log('⚠️ Welcome: Auth state change already processed, skipping...')
        return
      }

      setAuthInitialized(true)

      if (!firebaseUser) {
        console.log('❌ Welcome: No Firebase user found → redirecting to signin')
        setLoading(false)
        router.push('/signin')
        return
      }

      hasRun = true // Mark as run
      // Now we have a Firebase user - proceed with hydration
      await hydrateWorkMe()
    })

    return () => unsubscribe()
  }, [router, hydrateWorkMe])

  // Don't auto-redirect - let user stay on welcome page and click continue
  // Company reconciliation: Firebase ID → WorkMe → companyId (simple lookup, company-scoped)

  const handleContinue = () => {
    if (loading) {
      console.log('⏳ Welcome: Still loading, please wait...')
      return
    }

    if (typeof window !== 'undefined') {
      // Try to get workMe from state or localStorage
      const currentWorkMe = workMe || getWorkMe()
      const workMeCompanyId = currentWorkMe?.companyId || null

      if (workMeCompanyId) {
        // Ensure it's saved to localStorage for easy access
        localStorage.setItem('companyId', workMeCompanyId)
        localStorage.setItem('companyUnit', workMeCompanyId)
        // Go straight to dashboard - company scoped via firebaseid
        router.push('/dashboard')
        return
      }
    }

    // Fallback to dashboard if no companyId
    console.log('⚠️ Welcome: No companyId found, redirecting to dashboard')
    router.push('/dashboard')
  }

  // Show loading state while waiting for auth to initialize or hydrating
  if (loading || !authInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-xl mx-auto text-center space-y-8 bg-white/10 backdrop-blur-sm rounded-2xl p-12 shadow-2xl border border-white/20">
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

        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-white text-blue-700 py-4 px-8 rounded-xl font-semibold hover:bg-blue-50 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Get Started →'}
        </button>

        {workMe?.id && (
          <p className="text-white/60 text-sm">
            Account ID: {workMe.id.substring(0, 8)}...
          </p>
        )}
      </div>
    </div>
  )
}
