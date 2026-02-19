'use client'

import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Plus, FileText, ClipboardList, Target, Calendar } from 'lucide-react'
import api from '@/lib/api'

interface PerformancePlanObjective {
  id: string
  name: string
  howIllContribute: string | null
  howMeasured: string | null
  skillTopicIds: string[]
  sortOrder: number | null
}

interface ContributionSummaryRef {
  id: string
  periodStart: string
  periodEnd: string
  title: string | null
  summary: string | null
}

interface PerformancePlanDetail {
  id: string
  periodStart: string
  periodEnd: string
  periodType: string | null
  title: string | null
  performanceReviewSummary: string | null
  objectives: PerformancePlanObjective[]
  contributionSummaries: ContributionSummaryRef[]
}

export default function PerformanceReviewDetailPage() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [plan, setPlan] = useState<PerformancePlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddObjective, setShowAddObjective] = useState(false)
  const [newName, setNewName] = useState('')
  const [newHowIllContribute, setNewHowIllContribute] = useState('')
  const [newHowMeasured, setNewHowMeasured] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [parseOpen, setParseOpen] = useState(false)
  const [parseText, setParseText] = useState('')
  const [parseLoading, setParseLoading] = useState(false)
  const [parsedObjectives, setParsedObjectives] = useState<Array<{ name: string; howMeasured: string | null; howIllContribute?: string | null }>>([])
  const [allSummaries, setAllSummaries] = useState<ContributionSummaryRef[]>([])
  const [linkSummaryId, setLinkSummaryId] = useState('')
  const [linking, setLinking] = useState(false)
  const [reviewSummary, setReviewSummary] = useState('')
  const [savingReviewSummary, setSavingReviewSummary] = useState(false)
  const [periodType, setPeriodType] = useState('')
  const [savingPeriodType, setSavingPeriodType] = useState(false)
  const [goals, setGoals] = useState<Array<{ id: string; goal: string; targetDate: string | null }>>([])
  const [suggestForId, setSuggestForId] = useState<string | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestList, setSuggestList] = useState<string[]>([])
  const [applyingMeasure, setApplyingMeasure] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wid = getWorkMeIdFromStorage()
      if (!wid) {
        router.push('/signin')
      } else {
        setWorkMeId(wid)
        if (id) loadPlan()
      }
    }
  }, [router, id])

  async function loadPlan() {
    if (!id) return
    setLoading(true)
    try {
      const res = await api.get(`/api/performance-plans/${id}`)
      if (res.data.success) {
        const p = res.data.performancePlan
        setPlan(p)
        setReviewSummary(p?.performanceReviewSummary ?? '')
        setPeriodType(p?.periodType ?? '')
      }
    } catch (e) {
      console.error('Failed to load performance review:', e)
    }
    setLoading(false)
  }

  async function handleSaveReviewSummary() {
    if (!id) return
    setSavingReviewSummary(true)
    try {
      await api.put(`/api/performance-plans/${id}`, { performanceReviewSummary: reviewSummary.trim() || null })
      loadPlan()
    } catch (e) {
      console.error('Failed to save summary:', e)
    }
    setSavingReviewSummary(false)
  }

  async function loadSummaries() {
    try {
      const res = await api.get('/api/contribution-summaries')
      if (res.data.success) setAllSummaries(res.data.summaries || [])
    } catch (e) {
      console.error('Failed to load summaries:', e)
    }
  }

  async function loadGoals() {
    try {
      const res = await api.get('/api/goals')
      if (res.data.success) setGoals(res.data.goals || [])
    } catch (e) {
      console.error('Failed to load goals:', e)
    }
  }

  async function handleLinkAssessment() {
    if (!linkSummaryId || !id) return
    setLinking(true)
    try {
      await api.put(`/api/contribution-summaries/${linkSummaryId}`, { performancePlanId: id })
      setLinkSummaryId('')
      loadPlan()
    } catch (e) {
      console.error('Failed to link summary:', e)
    }
    setLinking(false)
  }

  async function handleUnlinkAssessment(summaryId: string) {
    try {
      await api.put(`/api/contribution-summaries/${summaryId}`, { performancePlanId: null })
      loadPlan()
    } catch (e) {
      console.error('Failed to unlink:', e)
    }
  }

  useEffect(() => {
    if (plan) {
      loadSummaries()
      loadGoals()
    }
  }, [plan?.id])

  async function handleAddObjective(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !id) return
    setSubmitting(true)
    try {
      await api.post(`/api/performance-plans/${id}/objectives`, {
        name: newName.trim(),
        howIllContribute: newHowIllContribute.trim() || null,
        howMeasured: newHowMeasured.trim() || null,
      })
      setNewName('')
      setNewHowIllContribute('')
      setNewHowMeasured('')
      setShowAddObjective(false)
      loadPlan()
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && (err as { response?: { data?: { error?: string } } }).response?.data?.error
      alert(msg || 'Failed to add objective')
    }
    setSubmitting(false)
  }

  async function handleParse() {
    if (!parseText.trim()) return
    setParseLoading(true)
    try {
      const res = await api.post('/api/performance-plans/objectives/parse', { rawText: parseText.trim() })
      if (res.data.success && Array.isArray(res.data.objectives)) setParsedObjectives(res.data.objectives)
      else setParsedObjectives([])
    } catch (e) {
      console.error('Parse failed:', e)
      setParsedObjectives([])
    }
    setParseLoading(false)
  }

  async function addParsedObjective(obj: { name: string; howMeasured: string | null; howIllContribute?: string | null }) {
    if (!id) return
    try {
      await api.post(`/api/performance-plans/${id}/objectives`, {
        name: obj.name,
        howMeasured: obj.howMeasured,
        howIllContribute: obj.howIllContribute ?? null,
      })
      setParsedObjectives(prev => prev.filter(o => o !== obj))
      loadPlan()
    } catch (e) {
      console.error('Failed to add objective:', e)
    }
  }

  async function handleDeleteObjective(objectiveId: string) {
    if (!confirm('Delete this objective?')) return
    try {
      await api.delete(`/api/performance-plan-objectives/${objectiveId}`)
      loadPlan()
    } catch (e) {
      console.error('Failed to delete:', e)
    }
  }

  async function handleSuggestHowMeasured(obj: PerformancePlanObjective) {
    setSuggestForId(obj.id)
    setSuggestLoading(true)
    setSuggestList([])
    try {
      const res = await api.post('/api/performance-plans/objectives/suggest-measures', {
        name: obj.name,
        howIllContribute: obj.howIllContribute ?? undefined,
      })
      if (res.data.success && Array.isArray(res.data.suggestions)) {
        setSuggestList(res.data.suggestions)
      } else {
        setSuggestForId(null)
      }
    } catch (e) {
      console.error('Failed to suggest measures:', e)
      setSuggestForId(null)
    }
    setSuggestLoading(false)
  }

  async function handleApplySuggestedMeasure(objectiveId: string, howMeasured: string) {
    setApplyingMeasure(objectiveId)
    try {
      await api.put(`/api/performance-plan-objectives/${objectiveId}`, { howMeasured: howMeasured.trim() || null })
      setSuggestForId(null)
      setSuggestList([])
      loadPlan()
    } catch (e) {
      console.error('Failed to update objective:', e)
    }
    setApplyingMeasure(null)
  }

  const isActive = (path: string) => (path === '/career' ? pathname === path : pathname?.startsWith(path))

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Performance review not found.</p>
          <Link href="/career/performance-reviews" className="text-blue-600 hover:underline mt-2 inline-block">Back to Performance reviews</Link>
        </div>
      </div>
    )
  }

  const periodLabel = `${new Date(plan.periodStart).toLocaleDateString()} – ${new Date(plan.periodEnd).toLocaleDateString()}`
  const linkedSummaries = plan.contributionSummaries || []
  const linkedIds = new Set(linkedSummaries.map(s => s.id))
  const availableToLink = allSummaries.filter(s => !linkedIds.has(s.id))
  const planStart = new Date(plan.periodStart)
  const planEnd = new Date(plan.periodEnd)
  const goalsInPeriod = goals.filter(g => {
    if (!g.targetDate) return true
    const d = new Date(g.targetDate)
    return d >= planStart && d <= planEnd
  })

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
          </nav>
        </aside>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/career/performance-reviews" className="text-blue-600 hover:underline text-sm">← Performance reviews</Link>
          </div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{plan.title || periodLabel}</h2>
            <p className="text-gray-600 mt-1">
              {periodLabel}
              {plan.periodType && ` · ${plan.periodType}`}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-sm text-gray-500">Period type:</label>
              <select
                value={periodType}
                onChange={e => {
                  const v = e.target.value
                  setPeriodType(v)
                  if (!id) return
                  setSavingPeriodType(true)
                  api.put(`/api/performance-plans/${id}`, { periodType: v === 'quarterly' || v === 'mid-year' || v === 'annual' ? v : null }).then(() => loadPlan()).catch(() => {}).finally(() => setSavingPeriodType(false))
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">—</option>
                <option value="quarterly">Quarterly</option>
                <option value="mid-year">Mid-year</option>
                <option value="annual">Annual</option>
              </select>
              {savingPeriodType && <span className="text-xs text-gray-400">Saving…</span>}
            </div>
          </div>

          {/* Plan (what was planned) */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-5 w-5" /> Plan
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setParseOpen(!parseOpen)}
                  className="text-sm px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Parse from text
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddObjective(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add objective
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">What was planned for this period.</p>

            {parseOpen && (
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-2">Paste job description or role expectations; we'll suggest objectives.</p>
                <textarea
                  value={parseText}
                  onChange={e => setParseText(e.target.value)}
                  placeholder="Paste text here…"
                  rows={4}
                  className="border rounded-md px-3 py-2 w-full text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={handleParse} disabled={parseLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {parseLoading ? 'Parsing…' : 'Parse'}
                  </button>
                  <button type="button" onClick={() => { setParseOpen(false); setParseText(''); setParsedObjectives([]) }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300">
                    Close
                  </button>
                </div>
                {parsedObjectives.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Suggested (click to add):</p>
                    <ul className="space-y-2">
                      {parsedObjectives.map((obj, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{obj.name}</span>
                            {obj.howIllContribute && <span className="text-gray-600 text-sm block">{obj.howIllContribute}</span>}
                            {obj.howMeasured && <span className="text-gray-500 text-sm block">{obj.howMeasured}</span>}
                          </div>
                          <button type="button" onClick={() => addParsedObjective(obj)} className="text-blue-600 hover:underline text-sm">Add</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {showAddObjective && (
              <form onSubmit={handleAddObjective} className="mb-6 p-4 bg-white rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">New objective</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="border rounded-md px-3 py-2 w-full" placeholder="e.g. Deliver Q2 roadmap" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How I'll contribute</label>
                    <input type="text" value={newHowIllContribute} onChange={e => setNewHowIllContribute(e.target.value)} className="border rounded-md px-3 py-2 w-full" placeholder="e.g. Own sprint planning and stakeholder updates" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How measured</label>
                    <input type="text" value={newHowMeasured} onChange={e => setNewHowMeasured(e.target.value)} className="border rounded-md px-3 py-2 w-full" placeholder="e.g. Completion by June 30" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Save</button>
                  <button type="button" onClick={() => { setShowAddObjective(false); setNewName(''); setNewHowIllContribute(''); setNewHowMeasured('') }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            )}

            {plan.objectives.length === 0 ? (
              <p className="text-gray-500 text-sm">No objectives yet. Add one or parse from text.</p>
            ) : (
              <ul className="space-y-2">
                {plan.objectives.map(obj => (
                  <li key={obj.id} className="flex items-start justify-between gap-4 p-4 bg-white rounded-lg border">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{obj.name}</p>
                      {obj.howIllContribute && <p className="text-sm text-gray-600 mt-1">{obj.howIllContribute}</p>}
                      {obj.howMeasured && <p className="text-sm text-gray-500 mt-1">{obj.howMeasured}</p>}
                      {suggestForId === obj.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                          {suggestLoading ? (
                            <p className="text-sm text-gray-500">Suggesting measures…</p>
                          ) : suggestList.length > 0 ? (
                            <>
                              <p className="text-xs font-medium text-gray-600 mb-2">Suggestions (numeric + qualitative). Pick one to use:</p>
                              <ul className="space-y-1">
                                {suggestList.map((s, i) => (
                                  <li key={i}>
                                    <button
                                      type="button"
                                      onClick={() => handleApplySuggestedMeasure(obj.id, s)}
                                      disabled={applyingMeasure === obj.id}
                                      className="text-left text-sm text-blue-600 hover:underline block w-full py-1"
                                    >
                                      {applyingMeasure === obj.id ? 'Applying…' : s}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                              <button type="button" onClick={() => { setSuggestForId(null); setSuggestList([]) }} className="mt-2 text-xs text-gray-500 hover:underline">Cancel</button>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSuggestHowMeasured(obj)}
                        disabled={suggestLoading}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        {suggestForId === obj.id && suggestLoading ? '…' : 'Suggest how measured'}
                      </button>
                      <button type="button" onClick={() => handleDeleteObjective(obj.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Review (what I did) */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" /> Review
            </h3>
            <p className="text-sm text-gray-600 mb-3">What I did this period. Add a summary and pull in prior assessments you created in <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:underline">Workforce stuff</Link> during the year.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">What I did (summary)</label>
              <textarea
                value={reviewSummary}
                onChange={e => setReviewSummary(e.target.value)}
                onBlur={handleSaveReviewSummary}
                placeholder="Summarize your contributions and outcomes for this period…"
                rows={4}
                className="border rounded-md px-3 py-2 w-full text-sm"
              />
              {savingReviewSummary && <p className="text-xs text-gray-500 mt-1">Saving…</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Prior assessments pulled into this review</label>
              {linkedSummaries.length === 0 ? (
                <p className="text-sm text-gray-500">None yet. Use the dropdown below to pull in assessments you created in Workforce stuff.</p>
              ) : (
                <ul className="space-y-3">
                  {linkedSummaries.map(s => (
                    <li key={s.id} className="p-4 bg-white rounded-lg border flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{s.title || 'Contribution summary'}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}
                        </p>
                        {s.summary && <p className="text-gray-700 mt-2 text-sm line-clamp-4">{s.summary}</p>}
                      </div>
                      <button type="button" onClick={() => handleUnlinkAssessment(s.id)} className="text-sm text-gray-500 hover:text-red-600 shrink-0">Unlink</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-600 text-sm mb-3">Pull in another prior assessment from Workforce stuff.</p>
              {availableToLink.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={linkSummaryId}
                    onChange={e => setLinkSummaryId(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select…</option>
                    {availableToLink.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title || `${new Date(s.periodStart).toLocaleDateString()} – ${new Date(s.periodEnd).toLocaleDateString()}`}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleLinkAssessment} disabled={!linkSummaryId || linking} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {linking ? 'Linking…' : 'Pull into review'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {allSummaries.length === 0
                    ? <>No other assessments to pull. Create them in <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:underline">Workforce stuff</Link> during the year.</>
                    : 'All your assessments are already pulled into this review.'}
                </p>
              )}
            </div>
          </section>

          {/* Goals vs outcomes — compare view (refactored from appraisal helper) */}
          <section className="mt-10 pt-8 border-t">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-indigo-600" /> Goals vs outcomes
            </h3>
            <p className="text-sm text-gray-600 mb-4">Compare what you planned (North Star goals) with what you did (outcomes) for this period. Quick reference for review prep.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" /> Goals (North Star)
                  </h4>
                  <Link href="/career/goals" className="text-blue-600 hover:underline text-sm">Manage →</Link>
                </div>
                <p className="text-sm text-gray-500 mb-4">What you planned for this period</p>
                {goalsInPeriod.length === 0 ? (
                  <p className="text-sm text-gray-500">No North Star goals for this period.</p>
                ) : (
                  <ul className="space-y-3">
                    {goalsInPeriod.map(g => (
                      <li key={g.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                        <p className="text-gray-900">{g.goal}</p>
                        {g.targetDate && <p className="text-xs text-gray-500 mt-1">Target: {new Date(g.targetDate).toLocaleDateString()}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-white rounded-lg shadow border p-6">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-green-600" /> Outcomes
                </h4>
                <p className="text-sm text-gray-500 mb-4">What you did (from Review above)</p>
                {linkedSummaries.length === 0 && !plan.performanceReviewSummary ? (
                  <p className="text-sm text-gray-500">No outcomes yet. Add a summary and pull in prior assessments in the Review section above.</p>
                ) : (
                  <div className="space-y-3">
                    {plan.performanceReviewSummary && (
                      <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                        <p className="text-xs text-gray-500 mb-1">Summary</p>
                        <p className="text-sm text-gray-700 line-clamp-4">{plan.performanceReviewSummary}</p>
                      </div>
                    )}
                    {linkedSummaries.map(s => (
                      <div key={s.id} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                        <h5 className="font-medium text-gray-900">{s.title || 'Contribution summary'}</h5>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}
                        </p>
                        {s.summary && <p className="text-sm text-gray-700 mt-2 line-clamp-3">{s.summary}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">Use this as a reference when preparing for your review. Doesn’t need to be perfect.</p>
          </section>
        </main>
      </div>
    </div>
  )
}
