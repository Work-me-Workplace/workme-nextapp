'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import api from '@/lib/api'
import { Building2, Search, Plus, CheckCircle2, Loader2 } from 'lucide-react'

interface CompanyUnit {
  id: string
  name: string
}

interface DivisionUnit {
  id: string
  name: string
  companyUnitId: string
}

export default function ProfileBuildPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Company selection state
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [companySearchResults, setCompanySearchResults] = useState<CompanyUnit[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyUnit | null>(null)
  const [showCompanyCreate, setShowCompanyCreate] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

  // Division selection state
  const [divisionSearchQuery, setDivisionSearchQuery] = useState('')
  const [divisionSearchResults, setDivisionSearchResults] = useState<DivisionUnit[]>([])
  const [selectedDivision, setSelectedDivision] = useState<DivisionUnit | null>(null)
  const [showDivisionCreate, setShowDivisionCreate] = useState(false)
  const [newDivisionName, setNewDivisionName] = useState('')

  // Current profile state
  const [currentCompany, setCurrentCompany] = useState<CompanyUnit | null>(null)
  const [currentDivision, setCurrentDivision] = useState<DivisionUnit | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadCurrentProfile()
      }
    }
  }, [router])

  const loadCurrentProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/workme/profile')
      if (response.data?.profile) {
        const profile = response.data.profile
        if (profile.company) {
          setCurrentCompany(profile.company)
          setSelectedCompany(profile.company)
        }
        if (profile.division) {
          setCurrentDivision(profile.division)
          setSelectedDivision(profile.division)
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      setCompanySearchResults([])
      return
    }

    try {
      const response = await api.post('/api/company/search', { query })
      if (response.data.success) {
        setCompanySearchResults(response.data.companies || [])
      }
    } catch (error) {
      console.error('Company search failed:', error)
      setCompanySearchResults([])
    }
  }

  const createCompany = async () => {
    if (!newCompanyName.trim()) return

    try {
      const response = await api.post('/api/company/create', { name: newCompanyName })
      if (response.data.success) {
        const company = response.data.company
        setSelectedCompany(company)
        setCurrentCompany(company)
        setNewCompanyName('')
        setShowCompanyCreate(false)
        setCompanySearchQuery('')
        setCompanySearchResults([])
        // Clear division when company changes
        setSelectedDivision(null)
        setCurrentDivision(null)
      }
    } catch (error: any) {
      alert(`Failed to create company: ${error.response?.data?.error || error.message}`)
    }
  }

  const searchDivisions = async (query: string) => {
    if (!query.trim() || !selectedCompany) {
      setDivisionSearchResults([])
      return
    }

    try {
      const response = await api.post('/api/division/search', {
        query,
        companyUnitId: selectedCompany.id,
      })
      if (response.data.success) {
        setDivisionSearchResults(response.data.divisions || [])
      }
    } catch (error) {
      console.error('Division search failed:', error)
      setDivisionSearchResults([])
    }
  }

  const createDivision = async () => {
    if (!newDivisionName.trim() || !selectedCompany) return

    try {
      const response = await api.post('/api/division/create', {
        name: newDivisionName,
        companyUnitId: selectedCompany.id,
      })
      if (response.data.success) {
        const division = response.data.division
        setSelectedDivision(division)
        setCurrentDivision(division)
        setNewDivisionName('')
        setShowDivisionCreate(false)
        setDivisionSearchQuery('')
        setDivisionSearchResults([])
      }
    } catch (error: any) {
      alert(`Failed to create division: ${error.response?.data?.error || error.message}`)
    }
  }

  const saveProfile = async () => {
    if (!selectedCompany) {
      alert('Please select a company')
      return
    }

    try {
      setSaving(true)
      const response = await api.post('/api/profile/company-division/save', {
        companyUnitId: selectedCompany.id,
        divisionUnitId: selectedDivision?.id || null,
      })

      if (response.data.success) {
        setCurrentCompany(selectedCompany)
        setCurrentDivision(selectedDivision)
        alert('Profile saved successfully!')
      }
    } catch (error: any) {
      alert(`Failed to save profile: ${error.response?.data?.error || error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hasChanges =
    (selectedCompany?.id !== currentCompany?.id) ||
    (selectedDivision?.id !== currentDivision?.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Workforce Profile</h1>
              <p className="text-gray-600 mt-2">Set up your company and division affiliation</p>
            </div>

            {/* Company Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Company
              </h2>

              {currentCompany && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">
                      Current: {currentCompany.name}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={companySearchQuery}
                    onChange={(e) => {
                      setCompanySearchQuery(e.target.value)
                      searchCompanies(e.target.value)
                    }}
                    placeholder="Search for your company..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {companySearchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {companySearchResults.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setSelectedCompany(company)
                          setCompanySearchQuery('')
                          setCompanySearchResults([])
                          setSelectedDivision(null) // Clear division when company changes
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          selectedCompany?.id === company.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{company.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedCompany && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-900">{selectedCompany.name}</span>
                      {selectedCompany.id === currentCompany?.id && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                )}

                {!showCompanyCreate && (
                  <button
                    onClick={() => setShowCompanyCreate(true)}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create new company
                  </button>
                )}

                {showCompanyCreate && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <input
                      type="text"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Enter company name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          createCompany()
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={createCompany}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCompanyCreate(false)
                          setNewCompanyName('')
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Division Selection (only if company selected) */}
            {selectedCompany && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                  Division (Optional)
                </h2>

                {currentDivision && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-900">
                        Current: {currentDivision.name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={divisionSearchQuery}
                      onChange={(e) => {
                        setDivisionSearchQuery(e.target.value)
                        searchDivisions(e.target.value)
                      }}
                      placeholder="Search for division..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {divisionSearchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                      {divisionSearchResults.map((division) => (
                        <button
                          key={division.id}
                          onClick={() => {
                            setSelectedDivision(division)
                            setDivisionSearchQuery('')
                            setDivisionSearchResults([])
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            selectedDivision?.id === division.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{division.name}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedDivision && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-purple-900">{selectedDivision.name}</span>
                        {selectedDivision.id === currentDivision?.id && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  )}

                  {!showDivisionCreate && (
                    <button
                      onClick={() => setShowDivisionCreate(true)}
                      className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create new division
                    </button>
                  )}

                  {showDivisionCreate && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <input
                        type="text"
                        value={newDivisionName}
                        onChange={(e) => setNewDivisionName(e.target.value)}
                        placeholder="Enter division name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            createDivision()
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={createDivision}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setShowDivisionCreate(false)
                            setNewDivisionName('')
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            {hasChanges && (
              <div className="bg-white rounded-lg shadow p-6">
                <button
                  onClick={saveProfile}
                  disabled={saving || !selectedCompany}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

