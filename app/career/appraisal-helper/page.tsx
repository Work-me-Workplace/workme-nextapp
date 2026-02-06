'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Target, FileText, Calendar, Plus } from 'lucide-react'
import api from '@/lib/api'

interface Goal {
  id: string
  goal: string
  targetDate: string | null
  createdAt: string
}

interface ContributionSummary {
  id: string
  periodStart: string
  periodEnd: string
  periodType: string | null
  title: string | null
  summary: string | null
  createdAt: string
}

export default function AppraisalHelperPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [summaries, setSummaries] = useState<ContributionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-year')

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
      const [goalsRes, summariesRes] = await Promise.all([
        api.get('/api/goals'),
        api.get('/api/contribution-summaries'),
      ])
      
      if (goalsRes.data.success) {
        setGoals(goalsRes.data.goals || [])
      }
      if (summariesRes.data.success) {
        setSummaries(summariesRes.data.summaries || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
    setLoading(false)
  }

  const isActive = (path: string) => {
    if (path === '/career') return pathname === path
    return pathname?.startsWith(path)
  }

  // Filter goals and summaries by selected period
  const now = new Date()
  const currentYearStart = new Date(now.getFullYear(), 0, 1)
  const currentYearEnd = new Date(now.getFullYear(), 11, 31)

  const filteredGoals = goals.filter(goal => {
    if (!goal.targetDate) return true // Include goals without dates
    const targetDate = new Date(goal.targetDate)
    if (selectedPeriod === 'current-year') {
      return targetDate >= currentYearStart && targetDate <= currentYearEnd
    }
    return true
  })

  const filteredSummaries = summaries.filter(summary => {
    const periodStart = new Date(summary.periodStart)
    const periodEnd = new Date(summary.periodEnd)
    if (selectedPeriod === 'current-year') {
      return periodStart <= currentYearEnd && periodEnd >= currentYearStart
    }
    return true
  })

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
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-6">
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
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Appraisal Helper</h2>
              <p className="text-gray-600 mt-2">
                Compare what you planned (goals) with what you accomplished (assessments)
              </p>
              <p className="text-sm text-gray-500 mt-1 italic">
                This is a helper - doesn't need to be perfect, just gives you something to reference for your appraisal.
              </p>
            </div>

            {/* Period Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="current-year">Current Year ({now.getFullYear()})</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Goals Column */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Goals (North Star)</h3>
                  </div>
                  <Link
                    href="/career/goals"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage →
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  What you planned/intended to accomplish
                </p>
                
                {filteredGoals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-sm">No goals for this period</p>
                    <Link
                      href="/career/goals"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                    >
                      Create your first goal →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGoals.map((goal) => (
                      <div
                        key={goal.id}
                        className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r"
                      >
                        <p className="text-gray-900">{goal.goal}</p>
                        {goal.targetDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assessments Column */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-6 w-6 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Assessments</h3>
                  </div>
                  <Link
                    href="/career/assessments"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Manage →
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  What you actually accomplished
                </p>
                
                {filteredSummaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-sm">No assessments for this period</p>
                    <Link
                      href="/career/assessments"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                    >
                      Create your first assessment →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSummaries.map((summary) => (
                      <div
                        key={summary.id}
                        className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {summary.title || 'Untitled Assessment'}
                          </h4>
                          {summary.periodType && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {summary.periodType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>
                            {new Date(summary.periodStart).toLocaleDateString()} - {new Date(summary.periodEnd).toLocaleDateString()}
                          </span>
                        </div>
                        {summary.summary && (
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {summary.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Card */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Goals Set:</span>
                  <span className="ml-2 font-semibold text-gray-900">{filteredGoals.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Assessments Created:</span>
                  <span className="ml-2 font-semibold text-gray-900">{filteredSummaries.length}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-4 italic">
                Use this as a reference when preparing for your appraisal. The goal is to have something on file, not perfection.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
