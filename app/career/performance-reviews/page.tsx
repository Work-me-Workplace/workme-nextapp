'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { ClipboardList, FileText, Calendar } from 'lucide-react'
import api from '@/lib/api'

interface Plan {
  id: string
  periodStart: string
  periodEnd: string
  periodType: string | null
  title: string | null
  createdAt: string
  updatedAt: string
  _count: { objectives: number }
}

interface Review {
  id: string
  periodStart: string
  periodEnd: string
  periodType: string | null
  title: string | null
  createdAt: string
  updatedAt: string
  _count: { accomplishments: number }
}

export default function PerformanceReviewsListPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState<'plan' | 'review' | null>(null)
  const [newPeriodStart, setNewPeriodStart] = useState('')
  const [newPeriodEnd, setNewPeriodEnd] = useState('')
  const [newPeriodType, setNewPeriodType] = useState<string>('')
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadAll()
      }
    }
  }, [router])

  async function loadAll() {
    setLoading(true)
    try {
      const [plansRes, reviewsRes] = await Promise.all([
        api.get('/api/performance-plans'),
        api.get('/api/performance-reviews'),
      ])
      if (plansRes.data.success) setPlans(plansRes.data.performancePlans || [])
      if (reviewsRes.data.success) setReviews(reviewsRes.data.performanceReviews || [])
    } catch (e) {
      console.error('Failed to load plans/reviews:', e)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newPeriodStart || !newPeriodEnd) return
    const kind = showNew
    setSubmitting(true)
    try {
      if (kind === 'plan') {
        const res = await api.post('/api/performance-plans', {
          periodStart: newPeriodStart,
          periodEnd: newPeriodEnd,
          periodType: newPeriodType === 'quarterly' || newPeriodType === 'mid-year' || newPeriodType === 'annual' ? newPeriodType : undefined,
          title: newTitle.trim() || undefined,
        })
        const createdId = res?.data?.performancePlan?.id
        setShowNew(null)
        setNewPeriodStart('')
        setNewPeriodEnd('')
        setNewPeriodType('')
        setNewTitle('')
        loadAll()
        if (createdId) router.push(`/career/performance-reviews/plans/${createdId}`)
      } else {
        const res = await api.post('/api/performance-reviews', {
          periodStart: newPeriodStart,
          periodEnd: newPeriodEnd,
          periodType: newPeriodType === 'quarterly' || newPeriodType === 'mid-year' || newPeriodType === 'annual' ? newPeriodType : undefined,
          title: newTitle.trim() || undefined,
        })
        const createdId = res?.data?.performanceReview?.id
        setShowNew(null)
        setNewPeriodStart('')
        setNewPeriodEnd('')
        setNewPeriodType('')
        setNewTitle('')
        loadAll()
        if (createdId) router.push(`/career/performance-reviews/reviews/${createdId}`)
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { error?: string } } }).response?.data?.error
      alert(msg || 'Failed to create')
    }
    setSubmitting(false)
  }

  const isActive = (path: string) => (path === '/career' ? pathname === path : pathname?.startsWith(path))

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Career</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/career" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career') && pathname === '/career' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Dashboard</Link>
                </li>
                <li>
                  <Link href="/career/goals" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/goals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Goals (North Star)</Link>
                </li>
                <li>
                  <Link href="/career/performance-reviews" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/performance-reviews') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Performance reviews</Link>
                </li>
                <li>
                  <Link href="/career/job-fit" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/job-fit') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Job Fit</Link>
                </li>
                <li>
                  <Link href="/career/next-job" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/next-job') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Next job</Link>
                </li>
                <li>
                  <Link href="/career/next-role" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/next-role') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>What I want</Link>
                </li>
                <li>
                  <Link href="/mycareer/track" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/mycareer/track') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Track</Link>
                </li>
                <li>
                  <Link href="/mycareer/achievements" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/mycareer/achievements') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Achievements</Link>
                </li>
                <li>
                  <Link href="/mycareer/reflections" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/mycareer/reflections') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Reflections</Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Performance reviews</h2>
            <p className="text-gray-600 mt-2">Start a <strong>Plan</strong> (what you’ll do this period) or a <strong>Review</strong> (what you did). Each has a period; add objectives to the plan and a summary to the review.</p>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowNew('plan')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <ClipboardList className="h-5 w-5 mr-2" /> Start a plan
            </button>
            <button
              type="button"
              onClick={() => setShowNew('review')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FileText className="h-5 w-5 mr-2" /> Start a review
            </button>
          </div>

          {showNew && (
            <form onSubmit={handleCreate} className="mb-8 p-4 bg-white rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{showNew === 'plan' ? 'New plan' : 'New review'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period start</label>
                  <input
                    type="date"
                    required
                    value={newPeriodStart}
                    onChange={e => setNewPeriodStart(e.target.value)}
                    className="border rounded-md px-3 py-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period end</label>
                  <input
                    type="date"
                    required
                    value={newPeriodEnd}
                    onChange={e => setNewPeriodEnd(e.target.value)}
                    className="border rounded-md px-3 py-2 w-full"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Period type (optional)</label>
                <select
                  value={newPeriodType}
                  onChange={e => setNewPeriodType(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                >
                  <option value="">—</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="mid-year">Mid-year</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2025 Annual Review"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="border rounded-md px-3 py-2 w-full"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowNew(null); setNewPeriodStart(''); setNewPeriodEnd(''); setNewPeriodType(''); setNewTitle('') }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {plans.length === 0 && reviews.length === 0 && !showNew ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No plans or reviews yet. Start a plan or start a review above.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {plans.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" /> Plans
                  </h3>
                  <ul className="space-y-3">
                    {plans.map(p => (
                      <li key={p.id}>
                        <Link
                          href={`/career/performance-reviews/plans/${p.id}`}
                          className="block bg-white rounded-lg shadow border p-4 hover:border-blue-400 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{p.title || `${new Date(p.periodStart).toLocaleDateString()} – ${new Date(p.periodEnd).toLocaleDateString()}`}</h3>
                              {(p.title || p.periodType) && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {p.title && `${new Date(p.periodStart).toLocaleDateString()} – ${new Date(p.periodEnd).toLocaleDateString()}`}
                                  {p.title && p.periodType && ' · '}
                                  {p.periodType && p.periodType}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{p._count.objectives} objectives</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Reviews
                  </h3>
                  <ul className="space-y-3">
                    {reviews.map(r => (
                      <li key={r.id}>
                        <Link
                          href={`/career/performance-reviews/reviews/${r.id}`}
                          className="block bg-white rounded-lg shadow border p-4 hover:border-blue-400 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{r.title || `${new Date(r.periodStart).toLocaleDateString()} – ${new Date(r.periodEnd).toLocaleDateString()}`}</h3>
                              {(r.title || r.periodType) && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {r.title && `${new Date(r.periodStart).toLocaleDateString()} – ${new Date(r.periodEnd).toLocaleDateString()}`}
                                  {r.title && r.periodType && ' · '}
                                  {r.periodType && r.periodType}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{r._count.accomplishments} accomplishments</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
