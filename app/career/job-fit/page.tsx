'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react'
import api from '@/lib/api'

interface MatchResult {
  requirement: { label: string; originalPhrase?: string; type: string }
  matched: boolean
  evidence?: string
  suggestedAngle?: string
}

interface JobFitResult {
  jobTitle?: string
  requirements: Array<{ label: string; originalPhrase?: string; type: string }>
  matches: MatchResult[]
  summary?: string
}

function JobFitPageContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [jobPostText, setJobPostText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<JobFitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
      }
    }
  }, [router])

  // Prefill JD from a target job when opening via "See how I fit" from next-job detail
  useEffect(() => {
    if (!workMeId || !jobId) return
    let cancelled = false
    fetch(`/api/next-job/target-jobs/${jobId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success || !data.targetJob?.rawDescription) return
        setJobPostText(data.targetJob.rawDescription)
        setResult(null)
        setError(null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [workMeId, jobId])

  async function handleMatch() {
    if (!jobPostText.trim()) {
      setError('Paste the job posting text first.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.post('/api/myskills/match-job-post', {
        jobPostText: jobPostText.trim(),
      })
      if (res.data.success) {
        setResult({
          jobTitle: res.data.jobTitle,
          requirements: res.data.requirements || [],
          matches: res.data.matches || [],
          summary: res.data.summary,
        })
      } else {
        setError(res.data.error || 'Something went wrong')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to match')
    }
    setLoading(false)
  }

  const isActive = (path: string) => {
    if (path === '/career') return pathname === path
    return pathname?.startsWith(path)
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const matchedCount = result?.matches?.filter((m) => m.matched).length ?? 0
  const gapCount = result?.matches?.filter((m) => !m.matched).length ?? 0

  const BAE_SAMPLE_JD = `Job Description
BAE Systems is hiring a dynamic and experienced Social Media Strategist to lead the digital strategy in the Platforms & Services (P&S) sector. This role will oversee the social media presence across six businesses within the P&S Sector, both domestically and internationally, ensuring alignment with our mission, values, and strategic objectives. This role must have a deep understating of social media principles and to apply them to advance business outcomes. This role will mature the communication team's capabilities by utilizing their proven track record of success and will continue to drive business growth. The ideal candidate will have a deep understanding of social media strategy and platforms, including Facebook, Instagram, LinkedIn, X, and YouTube. They will craft bold, impactful content tailored to key decision-makers in the White House, Pentagon, Capitol Hill, and across all branches of the U.S. military and allied forces.

Key Responsibilities:
Strategic Vision: Develop and execute a comprehensive social media strategy that aligns with the Platforms & Services business objectives and enhances BAE Systems' digital presence globally.
Content Creation: Write bold, compelling, and strategic social media copy that resonates with high-level audiences, including government officials, military leaders, and policymakers.
Platform Management: Oversee and manage content across Facebook, Instagram, LinkedIn, X, and YouTube, ensuring consistency, quality, and adherence to brand guidelines.
Audience Identification and Engagement: Conduct ongoing research to identify target audiences and market trends that influence them. Monitor and engage with key stakeholders and audiences, fostering meaningful connections and driving awareness of BAE Systems' mission and capabilities.
Analytics & Reporting: Track, analyze, and report on social media performance metrics to inform strategy and demonstrate ROI.
Impactful Leadership: Collaborate with business unit communications teams to ensure alignment and amplify key initiatives.
Crisis Management: Act as the first line of defense for social media-related issues, ensuring timely and appropriate responses to sensitive topics.
Trend Monitoring: Stay ahead of social media trends, platform updates, and emerging technologies to keep BAE Systems at the forefront of digital innovation.

Required Education, Experience, & Skills
Bachelor's Degree in Communications, Marketing, Journalism, or a related field and 6 years work experience or equivalent experience
Experience managing social media strategy for a large organization, preferably in the defense, technology, aerospace, or government sectors
Experience using social media analytics tools to measure performance and inform strategy
Exceptional writing and storytelling skills, with the ability to craft content that speaks to high-level decision-makers
Deep understanding of social media platforms, algorithms, and best practices, particularly for Facebook, Instagram, LinkedIn, X, and YouTube
Proven ability to manage multiple projects and priorities in a fast-paced, high-stakes environment
Strong analytical skills with the ability to understand the data and create data-driven storytelling
Strategic thinker with a results-driven mindset
Exceptional attention to detail and commitment to quality
Strong interpersonal and communication skills
Ability to work collaboratively across teams and functions
Adaptability to navigate complex and sensitive topics with professionalism

Preferred Education, Experience, & Skills
Experience working with government, military, or defense-related audiences is highly preferred
Experience supporting multiple business units and a diverse product portfolio
Experience in budgeting and analyzing ROI
Experience in international environments
Experience in Hootsuite or Google Analytics`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav - same as other career pages */}
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
        {/* Sidebar - same as career/page.tsx */}
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
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Setup</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/setup" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900">Modules</Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Job Fit</h2>
              <p className="text-gray-600 mt-2">
                Paste an HR or job posting below. We’ll parse out the skills and requirements and show where you already match — and where you might want to build a story or blog.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Job posting (copy/paste from the listing)</label>
              <textarea
                value={jobPostText}
                onChange={(e) => setJobPostText(e.target.value)}
                placeholder="Paste the full job description here (e.g. BAE Social Media Manager role)..."
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleMatch}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Parsing & matching…
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Parse & match to my skills
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJobPostText(BAE_SAMPLE_JD)
                    setResult(null)
                    setError(null)
                  }}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Load sample: BAE Social Media Strategist
                </button>
                {result && (
                  <span className="text-sm text-gray-500">
                    Uses your WorkSkills (skills, strengths, specialties). Update them in Setup if needed.
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {result.jobTitle && (
                  <p className="text-lg text-gray-700">
                    <span className="font-medium">Role:</span> {result.jobTitle}
                  </p>
                )}
                {result.summary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900 font-medium">{result.summary}</p>
                  </div>
                )}

                <div className="flex gap-6 text-sm">
                  <span className="text-green-700 font-medium">
                    <CheckCircle2 className="inline h-4 w-4 mr-1" />
                    {matchedCount} matched
                  </span>
                  <span className="text-amber-700 font-medium">
                    <XCircle className="inline h-4 w-4 mr-1" />
                    {gapCount} to strengthen or address
                  </span>
                </div>

                <div className="divide-y divide-gray-200">
                  {result.matches.map((m, i) => (
                    <div key={i} className="py-4 first:pt-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {m.matched ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{m.requirement.label}</p>
                          {m.requirement.originalPhrase && m.requirement.originalPhrase !== m.requirement.label && (
                            <p className="text-sm text-gray-500 mt-0.5">“{m.requirement.originalPhrase}”</p>
                          )}
                          {m.matched && m.evidence && (
                            <p className="mt-2 text-sm text-gray-700 bg-green-50 border border-green-100 rounded p-2">
                              <span className="font-medium text-green-800">You:</span> {m.evidence}
                            </p>
                          )}
                          {m.matched && m.suggestedAngle && (
                            <p className="mt-1 text-sm text-blue-700">
                              Blog angle: {m.suggestedAngle}
                            </p>
                          )}
                          {!m.matched && (
                            <p className="mt-1 text-sm text-amber-700">No matching evidence in your profile yet — consider adding a story or blog that speaks to this.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-700 mb-1">Next step</p>
                  <p>
                    Use your matched skills to generate blog topics (Career → Assessments, or your skills flow) and write content that positions you for this role. WorkMe’s blog topic generator uses your skills and evidence to suggest reflection-based posts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function JobFitPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <JobFitPageContent />
    </Suspense>
  )
}
