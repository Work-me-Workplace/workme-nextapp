'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCompanyXContext, deleteCompanyXContext } from '@/lib/actions/company-x'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'

export default function WorkContextDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contextId = params.contextId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [workContext, setWorkContext] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadContext()
      }
    }
  }, [contextId, router])

  async function loadContext() {
    if (!contextId) return
    setLoading(true)
    try {
      // Search across all CompanyX types to find the matching one
      // Since we don't have type in URL, we need to try all types
      const types: Array<'campaign' | 'impact_event' | 'training' | 'event' | 'community' | 'benefits' | 'career' | 'employee_cause'> = [
        'campaign',
        'impact_event',
        'training',
        'event',
        'community',
        'benefits',
        'career',
        'employee_cause',
      ]

      const clientWorkMeId = typeof window !== 'undefined' ? getWorkMeIdFromStorage() : null
      let foundContext: any = null
      let foundType: string | null = null

      // Try each type until we find a match
      for (const type of types) {
        const result = await getCompanyXContext(contextId, type, clientWorkMeId)
        if (result.success && result.workContext) {
          foundContext = result.workContext
          foundType = type
          break
        }
      }

      if (foundContext && foundType) {
        setWorkContext(foundContext)
      } else {
        console.error('Failed to load context: not found in any CompanyX type')
        alert('WorkContext not found')
        router.push('/mywork')
      }
    } catch (error) {
      console.error('Failed to load context:', error)
      alert('Failed to load context: ' + (error instanceof Error ? error.message : 'Unknown error'))
      router.push('/mywork')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!workContext?.type) {
      alert('Cannot delete: context type unknown')
      return
    }

    const contextType = workContext.type as 'campaign' | 'impact_event' | 'training' | 'event' | 'community' | 'benefits' | 'career' | 'employee_cause'
    if (!contextType) {
      alert('Cannot delete: invalid context type')
      return
    }

    if (confirm('Are you sure you want to delete this? This action cannot be undone.')) {
      const result = await deleteCompanyXContext(contextId, contextType)
      if (result.success) {
        router.push('/mywork')
      } else {
        alert('Failed to delete: ' + (result.error || 'Unknown error'))
      }
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!workContext) {
    return null
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/mywork" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to My Work
        </Link>

        {/* CompanyX Details */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded capitalize">
                  {workContext.type?.replace('_', ' ') || 'Company Item'}
                </span>
                <span className="text-sm text-gray-500">
                  Created {workContext.createdAt ? new Date(workContext.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{workContext.title || 'Untitled'}</h1>
              {workContext.description && (
                <p className="text-gray-600 mb-4">{workContext.description}</p>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
            >
              Delete
            </button>
          </div>

          {/* Show CompanyX metadata based on type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {workContext.type === 'campaign' && workContext && (
              <>
                {workContext.windowStart && (
                  <div>
                    <span className="font-medium text-gray-700">Window Start:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.windowStart).toLocaleString()}</span>
                  </div>
                )}
                {workContext.windowEnd && (
                  <div>
                    <span className="font-medium text-gray-700">Window End:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.windowEnd).toLocaleString()}</span>
                  </div>
                )}
                {workContext.sponsor && (
                  <div>
                    <span className="font-medium text-gray-700">Sponsor:</span>
                    <span className="ml-2 text-gray-600">{workContext.sponsor}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'impact_event' && workContext && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Details</h3>
                {workContext.effectiveDate && (
                  <div>
                    <span className="font-medium text-gray-700">Effective Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.effectiveDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.impactedPopulation && (
                  <div>
                    <span className="font-medium text-gray-700">Impacted Population:</span>
                    <span className="ml-2 text-gray-600">{workContext.impactedPopulation}</span>
                  </div>
                )}
                {workContext.urgency && (
                  <div>
                    <span className="font-medium text-gray-700">Urgency:</span>
                    <span className="ml-2 text-gray-600">{workContext.urgency}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'training' && workContext && (
              <>
                {workContext.trainingDate && (
                  <div>
                    <span className="font-medium text-gray-700">Training Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.trainingDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.deadline && (
                  <div>
                    <span className="font-medium text-gray-700">Deadline:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.deadline).toLocaleString()}</span>
                  </div>
                )}
                {workContext.sponsoringOffice && (
                  <div>
                    <span className="font-medium text-gray-700">Sponsoring Office:</span>
                    <span className="ml-2 text-gray-600">{workContext.sponsoringOffice}</span>
                  </div>
                )}
                {workContext.mandatory && (
                  <div>
                    <span className="font-medium text-gray-700">Mandatory:</span>
                    <span className="ml-2 text-gray-600">Yes</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'event' && workContext && (
              <>
                {workContext.eventDate && (
                  <div>
                    <span className="font-medium text-gray-700">Event Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.eventDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.startTime && (
                  <div>
                    <span className="font-medium text-gray-700">Start Time:</span>
                    <span className="ml-2 text-gray-600">{workContext.startTime}</span>
                  </div>
                )}
                {workContext.endTime && (
                  <div>
                    <span className="font-medium text-gray-700">End Time:</span>
                    <span className="ml-2 text-gray-600">{workContext.endTime}</span>
                  </div>
                )}
                {workContext.eventCategory && (
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{workContext.eventCategory}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'community' && workContext && (
              <>
                {workContext.date && (
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.date).toLocaleString()}</span>
                  </div>
                )}
                {workContext.partnerOrg && (
                  <div>
                    <span className="font-medium text-gray-700">Partner Org:</span>
                    <span className="ml-2 text-gray-600">{workContext.partnerOrg}</span>
                  </div>
                )}
                {workContext.location && (
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{workContext.location}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'benefits' && workContext && (
              <>
                {workContext.windowStart && (
                  <div>
                    <span className="font-medium text-gray-700">Enrollment Start:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.windowStart).toLocaleString()}</span>
                  </div>
                )}
                {workContext.windowEnd && (
                  <div>
                    <span className="font-medium text-gray-700">Enrollment End:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.windowEnd).toLocaleString()}</span>
                  </div>
                )}
                {workContext.annualRecurrence && (
                  <div>
                    <span className="font-medium text-gray-700">Annual Recurrence:</span>
                    <span className="ml-2 text-gray-600">Yes</span>
                  </div>
                )}
                {(workContext.fehbLink || workContext.fedvipLink || workContext.fsafedsLink) && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Enrollment Links:</span>
                    <div className="mt-2 space-y-1">
                      {workContext.fehbLink && (
                        <div><a href={workContext.fehbLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">FEHB</a></div>
                      )}
                      {workContext.fedvipLink && (
                        <div><a href={workContext.fedvipLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">FEDVIP</a></div>
                      )}
                      {workContext.fsafedsLink && (
                        <div><a href={workContext.fsafedsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">FSAFEDS</a></div>
                      )}
                    </div>
                  </div>
                )}
                {workContext.pocDepartment && (
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-600">{workContext.pocDepartment}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'career' && workContext && (
              <>
                {workContext.supervisorName && (
                  <div>
                    <span className="font-medium text-gray-700">Supervisor Name:</span>
                    <span className="ml-2 text-gray-600">{workContext.supervisorName}</span>
                  </div>
                )}
                {workContext.deadlines && Array.isArray(workContext.deadlines) && workContext.deadlines.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Deadlines:</span>
                    <div className="mt-2 space-y-2">
                      {workContext.deadlines.map((deadline: any, idx: number) => (
                        <div key={idx} className="pl-4 border-l-2 border-blue-200">
                          <span className="font-medium text-gray-700">{deadline.label}:</span>
                          <span className="ml-2 text-gray-600">
                            {deadline.date ? new Date(deadline.date).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {workContext.resourceLink && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Resource Link:</span>
                    <span className="ml-2"><a href={workContext.resourceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resources</a></span>
                  </div>
                )}
                {workContext.pocDepartment && (
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-600">{workContext.pocDepartment}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'employee_cause' && workContext && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 col-span-2">Employee Cause Details</h3>
                {workContext.partnerOrg && (
                  <div>
                    <span className="font-medium text-gray-700">Partner Organization:</span>
                    <span className="ml-2 text-gray-600">{workContext.partnerOrg}</span>
                  </div>
                )}
                {workContext.windowStart && (
                  <div>
                    <span className="font-medium text-gray-700">Collection Start:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.windowStart).toLocaleDateString()}</span>
                  </div>
                )}
                {workContext.windowEnd && (
                  <div>
                    <span className="font-medium text-gray-700">Collection End:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.windowEnd).toLocaleDateString()}</span>
                  </div>
                )}
                {workContext.location && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{workContext.location}</span>
                  </div>
                )}
                {workContext.sponsoringDepartment && (
                  <div>
                    <span className="font-medium text-gray-700">Sponsoring Department:</span>
                    <span className="ml-2 text-gray-600">{workContext.sponsoringDepartment}</span>
                  </div>
                )}
                {workContext.neededItems && Array.isArray(workContext.neededItems) && workContext.neededItems.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Needed Items:</span>
                    <div className="mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        {workContext.neededItems.map((item: string, idx: number) => (
                          <li key={idx} className="text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {workContext.collectionPoints && Array.isArray(workContext.collectionPoints) && workContext.collectionPoints.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Collection Points:</span>
                    <div className="mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        {workContext.collectionPoints.map((point: string, idx: number) => (
                          <li key={idx} className="text-gray-600">{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {workContext.signUpLink && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Sign Up Link:</span>
                    <span className="ml-2"><a href={workContext.signUpLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Sign Up</a></span>
                  </div>
                )}
              </>
            )}
            {/* POC Information - show for all types */}
            {(workContext.pocFirstName || workContext.pocLastName || workContext.pocEmail || workContext.pocPhone) && (
              <div className="col-span-2 border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Point of Contact</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(workContext.pocFirstName || workContext.pocLastName) && (
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">
                        {[workContext.pocFirstName, workContext.pocLastName].filter(Boolean).join(' ') || 'N/A'}
                      </span>
                    </div>
                  )}
                  {workContext.pocEmail && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2"><a href={`mailto:${workContext.pocEmail}`} className="text-blue-600 hover:underline">{workContext.pocEmail}</a></span>
                    </div>
                  )}
                  {workContext.pocPhone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2">{workContext.pocPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Output */}
            <Link
              href={`/mywork/products?companyXId=${contextId}&type=${workContext.type}`}
              className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Create Output</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Build outputs for this: email, poster, talking points, SharePoint block, event kit, and more.
              </p>
              <span className="text-blue-600 font-medium">Create Output →</span>
            </Link>

            {/* View Company Stuff */}
            <Link
              href="/mycompany/workforcestuff"
              className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Company Stuff</h3>
              </div>
              <p className="text-gray-600 mb-4">
                View all company happenings, events, campaigns, and more in one place.
              </p>
              <span className="text-blue-600 font-medium">View All →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

