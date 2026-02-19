'use client'

import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { ArrowLeft, Plus, User, Mail, Trash2 } from 'lucide-react'

interface CareerContact {
  id: string
  name: string | null
  email: string | null
  companyName: string | null
  roleInProcess: string | null
  notes: string | null
  lastContactAt: string | null
  nextAction: string | null
  createdAt: string
}

interface TargetJob {
  id: string
  jobTitle: string | null
  companyName: string | null
  rawDescription: string | null
  salaryBand: string | null
  industryOrRole: string | null
  sourceUrl: string | null
  status: string | null
  createdAt: string
  careerContacts: CareerContact[]
}

export default function NextJobDetailPage() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [job, setJob] = useState<TargetJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddContact, setShowAddContact] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    companyName: '',
    roleInProcess: '',
    notes: '',
    nextAction: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wid = getWorkMeIdFromStorage()
      if (!wid) {
        router.push('/signin')
        return
      }
      setWorkMeId(wid)
      if (id) loadJob()
    }
  }, [router, id])

  async function loadJob() {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/next-job/target-jobs/${id}`)
      const data = await res.json()
      if (data.success && data.targetJob) {
        setJob(data.targetJob)
      } else {
        setJob(null)
      }
    } catch (e) {
      console.error(e)
      setJob(null)
    }
    setLoading(false)
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/next-job/career-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetJobId: id,
          name: contactForm.name.trim() || undefined,
          email: contactForm.email.trim() || undefined,
          companyName: contactForm.companyName.trim() || undefined,
          roleInProcess: contactForm.roleInProcess.trim() || undefined,
          notes: contactForm.notes.trim() || undefined,
          nextAction: contactForm.nextAction.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success && data.careerContact) {
        setJob((prev) =>
          prev
            ? { ...prev, careerContacts: [data.careerContact, ...prev.careerContacts] }
            : null,
        )
        setContactForm({ name: '', email: '', companyName: '', roleInProcess: '', notes: '', nextAction: '' })
        setShowAddContact(false)
      } else {
        setError(data.error || 'Failed to add contact')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to add contact')
    }
    setSubmitting(false)
  }

  async function handleDeleteContact(contactId: string) {
    if (!confirm('Remove this contact?')) return
    try {
      const res = await fetch(`/api/next-job/career-contacts/${contactId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success && job) {
        setJob({
          ...job,
          careerContacts: job.careerContacts.filter((c) => c.id !== contactId),
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const isActive = (path: string) => (path === '/career' ? pathname === path : pathname?.startsWith(path))

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Job not found.</p>
          <Link href="/career/next-job" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to Next job
          </Link>
        </div>
      </div>
    )
  }

  const ROLE_OPTIONS = [
    { value: '', label: 'Select role…' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring manager' },
    { value: 'referral', label: 'Referral' },
    { value: 'other', label: 'Other' },
  ]

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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <Link href="/career/next-job" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Next job
              </Link>
              {job.rawDescription && (
                <Link
                  href={`/career/job-fit?jobId=${job.id}`}
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  See how I fit →
                </Link>
              )}
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{job.jobTitle || 'Untitled role'}</h2>
              <p className="text-gray-600 mt-1">
                {job.companyName || '—'}
                {job.industryOrRole && ` · ${job.industryOrRole}`}
                {job.salaryBand && ` · ${job.salaryBand}`}
              </p>
              {job.status && (
                <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {job.status}
                </span>
              )}
              {job.sourceUrl && (
                <p className="mt-2">
                  <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    View posting →
                  </a>
                </p>
              )}
              {job.rawDescription && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Job description</h3>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                    {job.rawDescription}
                  </pre>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Do I know anyone?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Add contacts for this role: recruiters, hiring managers, referrals. Network your way in.
              </p>
            </div>

            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAddContact((v) => !v)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add contact
              </button>
            </div>

            {showAddContact && (
              <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">New contact</h4>
                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={contactForm.companyName}
                        onChange={(e) => setContactForm((f) => ({ ...f, companyName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={contactForm.roleInProcess}
                        onChange={(e) => setContactForm((f) => ({ ...f, roleInProcess: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        {ROLE_OPTIONS.map((o) => (
                          <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={contactForm.notes}
                      onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="How you know them, context…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next action</label>
                    <input
                      type="text"
                      value={contactForm.nextAction}
                      onChange={(e) => setContactForm((f) => ({ ...f, nextAction: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="e.g. Send intro email by Friday"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Adding…' : 'Add contact'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddContact(false); setError(null); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {job.careerContacts.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
                <User className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="font-medium text-gray-700">No contacts yet</p>
                <p className="text-sm mt-1">Add someone you know at this company or who can refer you.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {job.careerContacts.map((c) => (
                  <li key={c.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{c.name || 'No name'}</p>
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="inline-flex items-center text-sm text-blue-600 hover:underline mt-1">
                            <Mail className="h-3.5 w-3 mr-1" />
                            {c.email}
                          </a>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {c.roleInProcess && (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                              {c.roleInProcess.replace('_', ' ')}
                            </span>
                          )}
                          {c.companyName && (
                            <span className="text-xs text-gray-500">{c.companyName}</span>
                          )}
                        </div>
                        {c.notes && <p className="text-sm text-gray-600 mt-2">{c.notes}</p>}
                        {c.nextAction && (
                          <p className="text-xs text-gray-500 mt-1">Next: {c.nextAction}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded"
                        title="Remove contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
