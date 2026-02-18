'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Plus, Calendar } from 'lucide-react'
import api from '@/lib/api'

interface Appraisal {
  id: string
  periodStart: string
  periodEnd: string
  title: string | null
  createdAt: string
  updatedAt: string
  _count: { objectives: number }
}

export default function AppraisalsListPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newPeriodStart, setNewPeriodStart] = useState('')
  const [newPeriodEnd, setNewPeriodEnd] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadAppraisals()
      }
    }
  }, [router])

  async function loadAppraisals() {
    setLoading(true)
    try {
      const res = await api.get('/api/appraisals')
      if (res.data.success) setAppraisals(res.data.appraisals || [])
    } catch (e) {
      console.error('Failed to load appraisals:', e)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newPeriodStart || !newPeriodEnd) return
    setSubmitting(true)
    try {
      await api.post('/api/appraisals', {
        periodStart: newPeriodStart,
        periodEnd: newPeriodEnd,
        title: newTitle.trim() || undefined,
      })
      setShowNew(false)
      setNewPeriodStart('')
      setNewPeriodEnd('')
      setNewTitle('')
      loadAppraisals()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { error?: string } } }).response?.data?.error
      alert(msg || 'Failed to create appraisal')
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
                  <Link href="/career/appraisals" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/appraisals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Appraisals</Link>
                </li>
                <li>
                  <Link href="/career/appraisals" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/appraisals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Objectives</Link>
                </li>
                <li>
                  <Link href="/career/assessments" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/assessments') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Assessments</Link>
                </li>
                <li>
                  <Link href="/career/appraisal-helper" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/appraisal-helper') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Appraisal Helper</Link>
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
            <h2 className="text-3xl font-bold text-gray-900">Appraisals</h2>
            <p className="text-gray-600 mt-2">Review cycles: set objectives per cycle and link your assessment.</p>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" /> New appraisal
            </button>
          </div>

          {showNew && (
            <form onSubmit={handleCreate} className="mb-8 p-4 bg-white rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">New appraisal cycle</h3>
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
                <button type="button" onClick={() => { setShowNew(false); setNewPeriodStart(''); setNewPeriodEnd(''); setNewTitle('') }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {appraisals.length === 0 && !showNew ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No appraisals yet. Create one to add objectives and link an assessment.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {appraisals.map(a => (
                <li key={a.id}>
                  <Link
                    href={`/career/appraisals/${a.id}`}
                    className="block bg-white rounded-lg shadow border p-4 hover:border-blue-400 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{a.title || `${new Date(a.periodStart).toLocaleDateString()} – ${new Date(a.periodEnd).toLocaleDateString()}`}</h3>
                        {a.title && (
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(a.periodStart).toLocaleDateString()} – {new Date(a.periodEnd).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{a._count.objectives} objectives</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
