'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Briefcase, Plus, Users } from 'lucide-react'

interface CareerContactSummary {
  id: string
  name: string | null
  email: string | null
  roleInProcess: string | null
}

interface TargetJob {
  id: string
  jobTitle: string | null
  companyName: string | null
  rawDescription: string | null
  salaryBand: string | null
  industryOrRole: string | null
  status: string | null
  createdAt: string
  careerContacts: CareerContactSummary[]
}

export default function NextJobListPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<TargetJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    jobTitle: '',
    companyName: '',
    rawDescription: '',
    salaryBand: '',
    industryOrRole: '',
    sourceUrl: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadJobs()
      }
    }
  }, [router])

  async function loadJobs() {
    setLoading(true)
    try {
      const res = await fetch('/api/next-job/target-jobs')
      const data = await res.json()
      if (data.success && Array.isArray(data.targetJobs)) {
        setJobs(data.targetJobs)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/next-job/target-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: form.jobTitle.trim() || undefined,
          companyName: form.companyName.trim() || undefined,
          rawDescription: form.rawDescription.trim() || undefined,
          salaryBand: form.salaryBand.trim() || undefined,
          industryOrRole: form.industryOrRole.trim() || undefined,
          sourceUrl: form.sourceUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success && data.targetJob) {
        setJobs((prev) => [data.targetJob, ...prev])
        setForm({ jobTitle: '', companyName: '', rawDescription: '', salaryBand: '', industryOrRole: '', sourceUrl: '' })
        setShowAddForm(false)
      } else {
        setError(data.error || 'Failed to save job')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save job')
    }
    setSubmitting(false)
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
                <li>
                  <Link href="/mywork" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">Dashboard</Link>
                </li>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Next job</h2>
              <p className="text-gray-600 mt-2">
                Save roles you want to apply to. For each one, ask: <strong>Do I know anyone?</strong> — and track contacts (recruiters, referrals, hiring managers).
              </p>
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowAddForm((v) => !v)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a job
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Save a req</h3>
                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                <form onSubmit={handleAddJob} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
                      <input
                        type="text"
                        value={form.jobTitle}
                        onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="e.g. Senior Comms Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job description (paste JD)</label>
                    <textarea
                      value={form.rawDescription}
                      onChange={(e) => setForm((f) => ({ ...f, rawDescription: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Paste the full job posting here…"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary band</label>
                      <input
                        type="text"
                        value={form.salaryBand}
                        onChange={(e) => setForm((f) => ({ ...f, salaryBand: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="e.g. $120k–140k"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry / role</label>
                      <input
                        type="text"
                        value={form.industryOrRole}
                        onChange={(e) => setForm((f) => ({ ...f, industryOrRole: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="e.g. comms, engineering"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link to posting (optional)</label>
                    <input
                      type="url"
                      value={form.sourceUrl}
                      onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="https://…"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Saving…' : 'Save job'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setError(null); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="font-medium text-gray-700">No target jobs yet</p>
                <p className="text-sm mt-1">Save a req to get started. Then for each job, add contacts: &ldquo;Do I know anyone?&rdquo;</p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add a job
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/career/next-job/${job.id}`}
                      className="block bg-white rounded-lg shadow border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {job.jobTitle || 'Untitled role'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {job.companyName || 'No company'}
                            {job.industryOrRole && ` · ${job.industryOrRole}`}
                            {job.salaryBand && ` · ${job.salaryBand}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {job.status && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {job.status}
                            </span>
                          )}
                          <span className="inline-flex items-center text-xs text-gray-500" title="Contacts">
                            <Users className="h-4 w-4 mr-1" />
                            {job.careerContacts?.length ?? 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
