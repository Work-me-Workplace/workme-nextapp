'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Target } from 'lucide-react'

interface NextRolePreference {
  id: string
  industry: string | null
  companyType: string | null
  note: string | null
  updatedAt: string
}

export default function NextRolePage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [pref, setPref] = useState<NextRolePreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    industry: '',
    companyType: '',
    note: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadPreference()
      }
    }
  }, [router])

  async function loadPreference() {
    setLoading(true)
    try {
      const res = await fetch('/api/next-job/preferences')
      const data = await res.json()
      if (data.success && data.preference) {
        setPref(data.preference)
        setForm({
          industry: data.preference.industry ?? '',
          companyType: data.preference.companyType ?? '',
          note: data.preference.note ?? '',
        })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/next-job/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: form.industry.trim() || undefined,
          companyType: form.companyType.trim() || undefined,
          note: form.note.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success && data.preference) {
        setPref(data.preference)
      } else {
        setError(data.error || 'Failed to save')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  const isActive = (path: string) => (path === '/career' ? pathname === path : pathname?.startsWith(path))

  if (!workMeId) {
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { localStorage.clear(); router.push('/signin') }}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">MyWork</h3>
              <ul className="space-y-1">
                <li><Link href="/mywork" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Career</h3>
              <ul className="space-y-1">
                <li><Link href="/career" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career') && pathname === '/career' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Dashboard</Link></li>
                <li><Link href="/career/goals" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/goals') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Goals (North Star)</Link></li>
                <li><Link href="/career/performance-reviews" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/performance-reviews') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Performance reviews</Link></li>
                <li><Link href="/career/job-fit" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/job-fit') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Job Fit</Link></li>
                <li><Link href="/career/next-job" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/next-job') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Next job</Link></li>
                <li><Link href="/career/next-role" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/career/next-role') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>What I want</Link></li>
                <li><Link href="/mycareer/track" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/mycareer/track') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Track</Link></li>
                <li><Link href="/mycareer/achievements" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/mycareer/achievements') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Achievements</Link></li>
                <li><Link href="/mycareer/reflections" className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive('/mycareer/reflections') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}>Reflections</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Setup</h3>
              <ul className="space-y-1">
                <li><Link href="/setup" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">Modules</Link></li>
              </ul>
            </div>
          </nav>
        </aside>

        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">What I want</h2>
              <p className="text-gray-600 mt-2">
                Industry, company type, and a note to yourself. Use this to frame your next move — and to compare with target jobs.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <form onSubmit={handleSave} className="space-y-4">
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={form.industry}
                      onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="e.g. comms, defense, tech"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company type</label>
                    <input
                      type="text"
                      value={form.companyType}
                      onChange={(e) => setForm((f) => ({ ...f, companyType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="e.g. startup, enterprise, agency"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (what you’re aiming for)</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                      rows={5}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Freeform: role level, location, non-negotiables, how this ties to your North Star…"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    {pref && (
                      <span className="text-xs text-gray-500">
                        Last saved {new Date(pref.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <Target className="inline h-4 w-4 mr-1 -mt-0.5" />
                Reqs you save in <Link href="/career/next-job" className="font-medium underline">Next job</Link> can be compared to this — so your applications reflect what you want, not just what popped up.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
