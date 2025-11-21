'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkContext, deleteWorkContext } from '@/lib/actions/work-context'
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
      // Pass workMeId from client as fallback
      const clientWorkMeId = typeof window !== 'undefined' ? getWorkMeIdFromStorage() : null
      const result = await getWorkContext(contextId, clientWorkMeId)
      if (result.success && result.workContext) {
        setWorkContext(result.workContext)
      } else {
        console.error('Failed to load context:', result.error)
        alert('WorkContext not found: ' + (result.error || 'Unknown error'))
        router.push('/mywork/context')
      }
    } catch (error) {
      console.error('Failed to load context:', error)
      alert('Failed to load context: ' + (error instanceof Error ? error.message : 'Unknown error'))
      router.push('/mywork/context')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this WorkContext? This will also delete all associated WorkOutputs.')) {
      const result = await deleteWorkContext(contextId)
      if (result.success) {
        router.push('/mywork/context')
      } else {
        alert('Failed to delete WorkContext')
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
        <Link href="/mywork/context" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
          ← Back to WorkContexts
        </Link>

        {/* WorkContext Details */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded capitalize">
                  {workContext.type.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(workContext.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{workContext.title}</h1>
              {workContext.typedData?.description && (
                <p className="text-gray-600 mb-4">{workContext.typedData.description}</p>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
            >
              Delete
            </button>
          </div>

          {/* Show typed context metadata based on type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {workContext.type === 'campaign' && workContext.typedData && (
              <>
                {workContext.typedData.windowStart && (
                  <div>
                    <span className="font-medium text-gray-700">Window Start:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.windowStart).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.windowEnd && (
                  <div>
                    <span className="font-medium text-gray-700">Window End:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.windowEnd).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.sponsor && (
                  <div>
                    <span className="font-medium text-gray-700">Sponsor:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.sponsor}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'impact_event' && workContext.typedData && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Details</h3>
                {workContext.typedData.effectiveDate && (
                  <div>
                    <span className="font-medium text-gray-700">Effective Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.effectiveDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.impactedPopulation && (
                  <div>
                    <span className="font-medium text-gray-700">Impacted Population:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.impactedPopulation}</span>
                  </div>
                )}
                {workContext.typedData.urgency && (
                  <div>
                    <span className="font-medium text-gray-700">Urgency:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.urgency}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'training' && workContext.typedData && (
              <>
                {workContext.typedData.trainingDate && (
                  <div>
                    <span className="font-medium text-gray-700">Training Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.trainingDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.deadline && (
                  <div>
                    <span className="font-medium text-gray-700">Deadline:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.deadline).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.sponsoringOffice && (
                  <div>
                    <span className="font-medium text-gray-700">Sponsoring Office:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.sponsoringOffice}</span>
                  </div>
                )}
                {workContext.typedData.mandatory && (
                  <div>
                    <span className="font-medium text-gray-700">Mandatory:</span>
                    <span className="ml-2 text-gray-600">Yes</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'event' && workContext.typedData && (
              <>
                {workContext.typedData.startDate && (
                  <div>
                    <span className="font-medium text-gray-700">Start Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.startDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.endDate && (
                  <div>
                    <span className="font-medium text-gray-700">End Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.endDate).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.location && (
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.location}</span>
                  </div>
                )}
                {workContext.typedData.eventCategory && (
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.eventCategory}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'community' && workContext.typedData && (
              <>
                {workContext.typedData.date && (
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.date).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.partnerOrg && (
                  <div>
                    <span className="font-medium text-gray-700">Partner Org:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.partnerOrg}</span>
                  </div>
                )}
                {workContext.typedData.location && (
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.location}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'benefits' && workContext.typedData && (
              <>
                {workContext.typedData.windowStart && (
                  <div>
                    <span className="font-medium text-gray-700">Enrollment Start:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.windowStart).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.windowEnd && (
                  <div>
                    <span className="font-medium text-gray-700">Enrollment End:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.windowEnd).toLocaleString()}</span>
                  </div>
                )}
                {workContext.typedData.annualRecurrence && (
                  <div>
                    <span className="font-medium text-gray-700">Annual Recurrence:</span>
                    <span className="ml-2 text-gray-600">Yes</span>
                  </div>
                )}
                {(workContext.typedData.fehbLink || workContext.typedData.fedvipLink || workContext.typedData.fsafedsLink) && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Enrollment Links:</span>
                    <div className="mt-2 space-y-1">
                      {workContext.typedData.fehbLink && (
                        <div><a href={workContext.typedData.fehbLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">FEHB</a></div>
                      )}
                      {workContext.typedData.fedvipLink && (
                        <div><a href={workContext.typedData.fedvipLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">FEDVIP</a></div>
                      )}
                      {workContext.typedData.fsafedsLink && (
                        <div><a href={workContext.typedData.fsafedsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">FSAFEDS</a></div>
                      )}
                    </div>
                  </div>
                )}
                {workContext.typedData.pocDepartment && (
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.pocDepartment}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'career' && workContext.typedData && (
              <>
                {workContext.typedData.supervisorName && (
                  <div>
                    <span className="font-medium text-gray-700">Supervisor Name:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.supervisorName}</span>
                  </div>
                )}
                {workContext.typedData.deadlines && Array.isArray(workContext.typedData.deadlines) && workContext.typedData.deadlines.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Deadlines:</span>
                    <div className="mt-2 space-y-2">
                      {workContext.typedData.deadlines.map((deadline: any, idx: number) => (
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
                {workContext.typedData.resourceLink && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Resource Link:</span>
                    <span className="ml-2"><a href={workContext.typedData.resourceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Resources</a></span>
                  </div>
                )}
                {workContext.typedData.pocDepartment && (
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.pocDepartment}</span>
                  </div>
                )}
              </>
            )}
            {workContext.type === 'employee_cause' && workContext.typedData && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 col-span-2">Employee Cause Details</h3>
                {workContext.typedData.partnerOrg && (
                  <div>
                    <span className="font-medium text-gray-700">Partner Organization:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.partnerOrg}</span>
                  </div>
                )}
                {workContext.typedData.windowStart && (
                  <div>
                    <span className="font-medium text-gray-700">Collection Start:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.windowStart).toLocaleDateString()}</span>
                  </div>
                )}
                {workContext.typedData.windowEnd && (
                  <div>
                    <span className="font-medium text-gray-700">Collection End:</span>
                    <span className="ml-2 text-gray-600">{new Date(workContext.typedData.windowEnd).toLocaleDateString()}</span>
                  </div>
                )}
                {workContext.typedData.location && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.location}</span>
                  </div>
                )}
                {workContext.typedData.sponsoringDepartment && (
                  <div>
                    <span className="font-medium text-gray-700">Sponsoring Department:</span>
                    <span className="ml-2 text-gray-600">{workContext.typedData.sponsoringDepartment}</span>
                  </div>
                )}
                {workContext.typedData.neededItems && Array.isArray(workContext.typedData.neededItems) && workContext.typedData.neededItems.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Needed Items:</span>
                    <div className="mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        {workContext.typedData.neededItems.map((item: string, idx: number) => (
                          <li key={idx} className="text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {workContext.typedData.collectionPoints && Array.isArray(workContext.typedData.collectionPoints) && workContext.typedData.collectionPoints.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Collection Points:</span>
                    <div className="mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        {workContext.typedData.collectionPoints.map((point: string, idx: number) => (
                          <li key={idx} className="text-gray-600">{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {workContext.typedData.signUpLink && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Sign Up Link:</span>
                    <span className="ml-2"><a href={workContext.typedData.signUpLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Sign Up</a></span>
                  </div>
                )}
              </>
            )}
            {/* POC Information - show for all types */}
            {(workContext.typedData?.pocFirstName || workContext.typedData?.pocLastName || workContext.typedData?.pocEmail || workContext.typedData?.pocPhone) && (
              <div className="col-span-2 border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Point of Contact</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(workContext.typedData.pocFirstName || workContext.typedData.pocLastName) && (
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">
                        {[workContext.typedData.pocFirstName, workContext.typedData.pocLastName].filter(Boolean).join(' ') || 'N/A'}
                      </span>
                    </div>
                  )}
                  {workContext.typedData.pocEmail && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2"><a href={`mailto:${workContext.typedData.pocEmail}`} className="text-blue-600 hover:underline">{workContext.typedData.pocEmail}</a></span>
                    </div>
                  )}
                  {workContext.typedData.pocPhone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2">{workContext.typedData.pocPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fork: Support or Outputs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What would you like to do?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WorkSupport */}
            <Link
              href={`/mywork/support/${contextId}`}
              className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">WorkSupport</h3>
              </div>
              <p className="text-gray-600 mb-4">
                View context details and notes. Minimal view for support and reference.
              </p>
              <span className="text-blue-600 font-medium">View Support →</span>
            </Link>

            {/* WorkOutputs */}
            <Link
              href={`/mywork/outputs/${contextId}`}
              className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">WorkOutputs</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Build outputs for this context: email, poster, talking points, SharePoint block, event kit, and more.
              </p>
              <span className="text-blue-600 font-medium">Build Outputs →</span>
            </Link>
          </div>
        </div>

        {/* Existing Outputs */}
        {workContext.outputs && workContext.outputs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing WorkOutputs</h3>
            <div className="space-y-3">
              {workContext.outputs.map((output: any) => (
                <Link
                  key={output.id}
                  href={`/mywork/outputs/builder/${output.id}`}
                  className="block border-l-4 border-blue-600 pl-4 py-2 hover:bg-gray-50 rounded-r"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{output.outputType.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        Updated {new Date(output.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

