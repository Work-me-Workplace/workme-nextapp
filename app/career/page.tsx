'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
// DEPRECATED: achievements and objectives actions are deprecated
// import { getAchievements } from '@/lib/actions/achievements'
// import { getObjectives } from '@/lib/actions/objectives'

export default function CareerDashboardPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [achievementsCount, setAchievementsCount] = useState(0)
  const [objectivesCount, setObjectivesCount] = useState(0)
  const [assessmentsCount, setAssessmentsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadData()
      }
    }
  }, [router])

  async function loadData() {
    setLoading(true)
    try {
      // Load goals count
      const goalsRes = await fetch('/api/goals')
      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setObjectivesCount(data.goals?.length || 0)
      }
      // Load assessments count
      const assessmentsRes = await fetch('/api/contribution-summaries')
      if (assessmentsRes.ok) {
        const data = await assessmentsRes.json()
        setAssessmentsCount(data.summaries?.length || 0)
      }
      // Achievements still deprecated
      setAchievementsCount(0)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setLoading(false)
  }

  const isActive = (path: string) => {
    if (path === '/career') return pathname === path
    return pathname?.startsWith(path)
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/signin')
                }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                MyWork
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/mywork"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Career
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/career"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career') && pathname === '/career'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/goals"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career/goals')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Goals (North Star)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/assessments"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career/assessments')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Assessments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/career/appraisal-helper"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/career/appraisal-helper')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Appraisal Helper
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mycareer/track"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/mycareer/track')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Track
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mycareer/achievements"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/mycareer/achievements')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Achievements
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mycareer/reflections"
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/mycareer/reflections')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    Reflections
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Setup
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/setup"
                    className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    Modules
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Career Planning Dashboard</h2>
              <p className="text-gray-600 mt-2">Your networking and career growth overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Goals (North Star)</h3>
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{objectivesCount}</p>
                <p className="text-sm text-gray-500 mb-4">What you're aiming for</p>
                <Link 
                  href="/career/goals"
                  className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Goals →
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Assessments</h3>
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{assessmentsCount}</p>
                <p className="text-sm text-gray-500 mb-4">What you accomplished</p>
                <Link 
                  href="/career/assessments"
                  className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Assessments →
                </Link>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appraisal Helper</h3>
                  <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 mb-4">Compare goals vs assessments</p>
                <Link 
                  href="/career/appraisal-helper"
                  className="inline-block mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                >
                  Open Helper →
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Get Started with Career Planning</h3>
              <p className="text-blue-100 mb-6">
                At least have a north star on file. Set your goals, document what you accomplished, 
                and use the appraisal helper to prepare for reviews. Doesn't need to be perfect - 
                just have something to reference.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link 
                  href="/career/goals" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Set Your Goals
                </Link>
                <Link 
                  href="/career/assessments" 
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Create Assessment
                </Link>
                <Link 
                  href="/career/appraisal-helper" 
                  className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-400 transition"
                >
                  Appraisal Helper
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

