'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { Building2, Users, TrendingUp, MapPin, Globe, Phone, Mail } from 'lucide-react'

interface Company {
  id: string
  name: string
  industry?: string | null
  website?: string | null
  city?: string | null
  state?: string | null
  description?: string | null
  headcount?: number | null
  missionStatement?: string | null
  vision?: string | null
  values?: string | null
  ceoName?: string | null
  ceoTitle?: string | null
  deputyName?: string | null
  deputyTitle?: string | null
  chiefOfStaff?: string | null
  directorates?: string[]
  linkedinUrl?: string | null
  twitterUrl?: string | null
  phone?: string | null
  brandLogoUrl?: string | null
}

export default function CompanyProfilePage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadCompany(id)
      }
    }
  }, [router])

  async function loadCompany(workMeId: string) {
    try {
      setLoading(true)
      const response = await api.get(`/api/workme/profile?workMeId=${workMeId}`)
      if (response.data?.workMe?.company) {
        setCompany(response.data.workMe.company)
      } else if (response.data?.workMe?.companyId) {
        // Try to load company by ID
        const companyResponse = await api.get(`/api/workme/company?companyId=${response.data.workMe.companyId}`)
        if (companyResponse.data?.company) {
          setCompany(companyResponse.data.company)
        }
      }
    } catch (error) {
      console.error('Failed to load company:', error)
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
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
              <p className="text-gray-600 mt-2">Company snapshot and information</p>
            </div>

            {!company ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Company Profile</h3>
                <p className="text-gray-600 mb-4">Your company profile hasn't been set up yet.</p>
                <Link
                  href="/workme/company/enrich"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Enrich Company Profile
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Company Summary Card */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center">
                      {company.brandLogoUrl ? (
                        <img src={company.brandLogoUrl} alt={company.name} className="h-16 w-16 rounded-lg mr-4" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                          <Building2 className="h-8 w-8 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
                        {company.industry && (
                          <p className="text-gray-600 mt-1">{company.industry}</p>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/workme/company/enrich"
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Edit Profile
                    </Link>
                  </div>

                  {company.description && (
                    <p className="text-gray-700 mb-4">{company.description}</p>
                  )}

                  {/* Company Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {company.headcount && (
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Users className="h-6 w-6 text-gray-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Headcount</p>
                          <p className="text-lg font-semibold text-gray-900">{company.headcount.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    {company.city && company.state && (
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <MapPin className="h-6 w-6 text-gray-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="text-lg font-semibold text-gray-900">{company.city}, {company.state}</p>
                        </div>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <Globe className="h-6 w-6 text-gray-600 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Website</p>
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-600 hover:underline">
                            Visit Site
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mission, Vision, Values */}
                {(company.missionStatement || company.vision || company.values) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Identity</h3>
                    <div className="space-y-4">
                      {company.missionStatement && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Mission</h4>
                          <p className="text-gray-700">{company.missionStatement}</p>
                        </div>
                      )}
                      {company.vision && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Vision</h4>
                          <p className="text-gray-700">{company.vision}</p>
                        </div>
                      )}
                      {company.values && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Values</h4>
                          <p className="text-gray-700">{company.values}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Leadership Grid (Stub) */}
                {(company.ceoName || company.deputyName || company.chiefOfStaff) && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Leadership</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {company.ceoName && (
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">{company.ceoTitle || 'CEO/Commander'}</p>
                          <p className="font-semibold text-gray-900">{company.ceoName}</p>
                        </div>
                      )}
                      {company.deputyName && (
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">{company.deputyTitle || 'Deputy/COO'}</p>
                          <p className="font-semibold text-gray-900">{company.deputyName}</p>
                        </div>
                      )}
                      {company.chiefOfStaff && (
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Chief of Staff</p>
                          <p className="font-semibold text-gray-900">{company.chiefOfStaff}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Milestones Preview (Stub) */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Recent Milestones</h3>
                    <Link href="/mycompany/milestones" className="text-sm text-blue-600 hover:text-blue-700">
                      View All →
                    </Link>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No milestones yet</p>
                  </div>
                </div>

                {/* Recent Workforce Stuff Preview (Stub) */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Recent Workforce Stuff</h3>
                    <Link href="/mycompany/workforcestuff" className="text-sm text-blue-600 hover:text-blue-700">
                      View All →
                    </Link>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No workforce items yet</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

