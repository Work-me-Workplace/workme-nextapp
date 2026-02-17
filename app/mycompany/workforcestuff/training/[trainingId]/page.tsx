'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { WorkProductContainer } from '@/components/workproduct/WorkProductContainer'
import { Calendar, Clock, MapPin, User, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

export type RegistrationLinkItem = { label?: string; url: string }
export type TimeSlotItem = { date?: string; startTime: string; endTime: string; label?: string }

interface CompanyTraining {
  id: string
  title: string | null
  topic: string | null
  description: string | null
  mandatory: boolean
  sponsoringOffice: string | null
  trainingDate: string | null
  startTime: string | null
  endTime: string | null
  timeSlots: TimeSlotItem[] | null
  completionDeadline: string | null
  isSelfPaced: boolean
  registrationDeadline: string | null
  location: string | null
  format: 'in-person' | 'virtual' | 'hybrid' | null
  link: string | null
  registrationLinks: RegistrationLinkItem[] | null
  pocFirstName: string | null
  pocLastName: string | null
  pocEmail: string | null
  pocPhone: string | null
  pocRankOrTitle: string | null
  ingestStatus: string | null
  createdAt: string
}

export default function TrainingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const trainingId = params?.trainingId as string
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [training, setTraining] = useState<CompanyTraining | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadTraining()
      }
    }
  }, [router, trainingId])

  async function loadTraining() {
    try {
      setLoading(true)
      const response = await api.get(`/api/workforcestuff/training/${trainingId}`)
      
      if (response.data.success && response.data.training) {
        setTraining(response.data.training)
      } else {
        console.error('Failed to load training:', response.data.error)
      }
    } catch (error) {
      console.error('Failed to load training:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
            ← Back to Workforce Stuff
          </Link>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Not Found</h3>
            <p className="text-gray-600">The training you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    )
  }

  const pocName = training.pocFirstName || training.pocLastName
    ? `${training.pocFirstName || ''} ${training.pocLastName || ''}`.trim()
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
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
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/mycompany/workforcestuff" className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm">
              ← Back to Workforce Stuff
            </Link>

            <WorkProductContainer
              source={{
                id: training.id,
                type: 'training',
                title: training.title || 'Untitled Training',
                description: training.description,
                summary: training.topic ?? training.description,
              }}
              layout="stack"
            >
            <div className="bg-white rounded-lg shadow p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Training
                      </span>
                      {training.mandatory && (
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                          Mandatory
                        </span>
                      )}
                      {training.ingestStatus === 'pending' && (
                        <>
                          <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                            Pending Review
                          </span>
                          <Link
                            href={`/mycompany/workforcestuff/training/ingest/${training.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                          >
                            Review & Save →
                          </Link>
                        </>
                      )}
                      {training.ingestStatus === 'saved' && (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                          Saved
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {training.title || 'Untitled Training'}
                    </h1>
                    {training.topic && (
                      <p className="text-lg text-blue-600 font-medium">{training.topic}</p>
                    )}
                    {training.sponsoringOffice && (
                      <p className="text-sm text-gray-600 mt-1">Sponsored by: {training.sponsoringOffice}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {training.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{training.description}</p>
                </div>
              )}

              {/* Date & Time */}
              {(training.trainingDate || training.startTime || training.endTime || (Array.isArray(training.timeSlots) && training.timeSlots.length > 0) || training.completionDeadline || training.isSelfPaced) && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    {training.isSelfPaced ? 'Self-Paced Training' : 'Schedule'}
                  </h2>
                  {training.isSelfPaced ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">📚 Self-Paced Training</p>
                        <p className="text-sm text-blue-700">This training can be completed at your own pace.</p>
                      </div>
                      {training.completionDeadline && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Complete By (Deadline)</p>
                          <p className="text-gray-900 font-medium text-lg">
                            {new Date(training.completionDeadline).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : Array.isArray(training.timeSlots) && training.timeSlots.length > 0 ? (
                    <div className="space-y-4">
                      {training.trainingDate && (
                        <p className="text-sm text-gray-500 mb-1">Training Date</p>
                      )}
                      {training.trainingDate && (
                        <p className="text-gray-900 font-medium mb-4">
                          {new Date(training.trainingDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mb-2">Times</p>
                      <ul className="space-y-2">
                        {training.timeSlots.map((slot, i) => (
                          <li key={i} className="flex items-center gap-2 text-gray-900">
                            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                            {slot.date && (
                              <span>
                                {new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {' — '}
                              </span>
                            )}
                            <span>
                              {slot.startTime}–{slot.endTime}
                              {slot.label ? ` (${slot.label})` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {training.trainingDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Training Date</p>
                          <p className="text-gray-900 font-medium">
                            {new Date(training.trainingDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                      {training.startTime && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Start Time</p>
                          <p className="text-gray-900 font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {training.startTime}
                          </p>
                        </div>
                      )}
                      {training.endTime && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">End Time</p>
                          <p className="text-gray-900 font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {training.endTime}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Location & Format */}
              {(training.location || training.format) && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Format</h2>
                  <div className="space-y-2">
                    {training.location && (
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                        {training.location}
                      </div>
                    )}
                    {training.format && (
                      <div className="text-gray-700">
                        <span className="font-medium">Format:</span> {training.format.charAt(0).toUpperCase() + training.format.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registration deadline */}
              {training.registrationDeadline && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Registration Deadline</h2>
                  <p className="text-gray-700">
                    {new Date(training.registrationDeadline).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Registration links: multiple (registrationLinks) or single (link) */}
              {(() => {
                const links = Array.isArray(training.registrationLinks) && training.registrationLinks.length > 0
                  ? training.registrationLinks
                  : training.link
                    ? [{ url: training.link } as RegistrationLinkItem]
                    : []
                if (links.length === 0) return null
                return (
                  <div className="mb-6 border-t pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {links.length === 1 ? 'Registration Link' : 'Registration Links'}
                    </h2>
                    <ul className="space-y-2">
                      {links.map((item, i) => (
                        <li key={i}>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 underline"
                          >
                            {item.label ? `${item.label} — register here` : item.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}

              {/* Point of Contact */}
              {(pocName || training.pocEmail || training.pocPhone || training.pocRankOrTitle) && (
                <div className="mb-6 border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Point of Contact
                  </h2>
                  <div className="space-y-2">
                    {training.pocRankOrTitle && pocName && (
                      <p className="text-gray-900 font-medium">
                        {training.pocRankOrTitle} {pocName}
                      </p>
                    )}
                    {!training.pocRankOrTitle && pocName && (
                      <p className="text-gray-900 font-medium">{pocName}</p>
                    )}
                    {training.pocEmail && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`mailto:${training.pocEmail}`} className="text-blue-600 hover:text-blue-700">
                          {training.pocEmail}
                        </a>
                      </div>
                    )}
                    {training.pocPhone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`tel:${training.pocPhone}`} className="text-blue-600 hover:text-blue-700">
                          {training.pocPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-6 text-sm text-gray-500">
                <p>Created: {new Date(training.createdAt).toLocaleString()}</p>
              </div>
            </div>
            </WorkProductContainer>
          </div>
        </main>
      </div>
    </div>
  )
}

