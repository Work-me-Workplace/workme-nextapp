'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { getWorkMe, refreshWorkMe, type WorkMe } from '@/lib/workme.client'
import { getDashboard, refreshDashboard, type DashboardData } from '@/lib/dashboard.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import PersonalUX from '@/components/personal/PersonalUX'
import { TrendingUp, Bell, Briefcase, CheckCircle2, Sparkles, X, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMe, setWorkMe] = useState<WorkMe | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyAssigned, setCompanyAssigned] = useState<string | null>(null)
  const [showGrowthPrompt, setShowGrowthPrompt] = useState(false)

  // Check for company assignment success message
  useEffect(() => {
    const companyName = searchParams.get('companyAssigned')
    if (companyName) {
      setCompanyAssigned(companyName)
      setShowGrowthPrompt(true)
      // Remove query param from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('companyAssigned')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Two-Phase Hydration:
  // Phase 1: Ensure WorkMe is hydrated (should already be from welcome)
  // Phase 2: Hydrate all models that depend on WorkMe (employees, highlights, etc.)
  useEffect(() => {
    const hydrateDashboard = async () => {
      if (typeof window === 'undefined') return

      try {
        setError(null)

        // Phase 1: Check WorkMe hydration
        let storedWorkMe = getWorkMe()
        
        if (!storedWorkMe) {
          // Not hydrated yet - fetch from API
          console.log('[Dashboard] Phase 1: WorkMe not in localStorage, fetching...')
          storedWorkMe = await refreshWorkMe()
        }
        
        if (!storedWorkMe) {
          // No WorkMe found - redirect to welcome
          console.warn('[Dashboard] WorkMe not found, redirecting to welcome')
          router.push('/welcome')
          return
        }

        setWorkMe(storedWorkMe)
        console.log('[Dashboard] Phase 1 complete:', {
          id: storedWorkMe.id,
          companyId: storedWorkMe.companyId,
          companyUnit: storedWorkMe.companyUnit,
        })

        // Phase 2: Hydrate dashboard models
        let storedDashboard = getDashboard()
        
        if (!storedDashboard) {
          // Not hydrated yet - fetch from API
          console.log('[Dashboard] Phase 2: Hydrating dashboard models...')
          storedDashboard = await refreshDashboard()
        }
        
        if (storedDashboard) {
          setDashboard(storedDashboard)
          console.log('[Dashboard] Phase 2 complete:', {
            employees: storedDashboard.employees.length,
            highlights: storedDashboard.highlights.length,
            campaigns: storedDashboard.campaigns.length,
          })
        } else {
          // Dashboard hydration failed but don't block the page
          console.warn('[Dashboard] Phase 2: Failed to hydrate dashboard, continuing with empty data')
        }
      } catch (err: any) {
        console.error('[Dashboard] Hydration error:', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    hydrateDashboard()
  }, [router])

  if (!workMe || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="flex">
        {/* Sidebar */}
        <SidebarNav />

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Your work overview and quick access</p>
            </div>

            {/* Company Assignment Success Message */}
            {companyAssigned && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">
                      We've assigned you to {companyAssigned}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      You're all set! Start your WorkMe growth journey below.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCompanyAssigned(null)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Growth Journey Prompt */}
            {showGrowthPrompt && (
              <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Start Your WorkMe Growth Journey</h3>
                      <p className="text-blue-100 mb-4">
                        Begin tracking your career milestones, achievements, and professional growth. 
                        Set goals, document your progress, and build your professional identity.
                      </p>
                      <div className="flex gap-3">
                        <Link
                          href="/career"
                          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition inline-flex items-center gap-2"
                        >
                          <span>Enter Growth Journey</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setShowGrowthPrompt(false)}
                          className="px-6 py-2 border-2 border-white/30 text-white rounded-lg font-semibold hover:bg-white/10 transition"
                        >
                          Maybe Later
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGrowthPrompt(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Personal UX Component */}
            <PersonalUX />

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* My Progress Card */}
              <Link
                href="/career"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">My Progress</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Track your career milestones, achievements, and professional growth
                </p>
                <span className="text-blue-600 font-medium text-sm">View Progress →</span>
              </Link>

              {/* Top Signals Card */}
              <Link
                href="/events"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Bell className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">Top Signals</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Important events, notifications, and company happenings
                </p>
                <span className="text-blue-600 font-medium text-sm">View Signals →</span>
              </Link>

              {/* Stuff I'm Working On Card */}
              <Link
                href="/tasks"
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Briefcase className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">Stuff I'm Working On</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Your active tasks, projects, and work items
                </p>
                <span className="text-blue-600 font-medium text-sm">View Tasks →</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
