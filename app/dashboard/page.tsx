'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMe, refreshWorkMe, type WorkMe } from '@/lib/workme.client'
import { getDashboard, refreshDashboard, type DashboardData } from '@/lib/dashboard.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import PersonalUX from '@/components/personal/PersonalUX'
import { TrendingUp, Bell, Briefcase } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [workMe, setWorkMe] = useState<WorkMe | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Two-Phase Hydration:
  // Phase 1: Ensure WorkMe is hydrated (should already be from welcome)
  // Phase 2: Hydrate all models that depend on WorkMe (employees, highlights, etc.)
  useEffect(() => {
    const hydrateDashboard = async () => {
      if (typeof window === 'undefined') return

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
      }
      
      setLoading(false)
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
