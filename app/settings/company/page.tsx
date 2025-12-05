'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import api from '@/lib/api'
import { Building2, Search, Plus, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CompanyHQ {
  id: string
  name: string
}

interface CompanyUnit {
  id: string
  name: string
}

interface DivisionUnit {
  id: string
  name: string
  companyUnitId: string
}

export default function CompanySettingsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Company HQ selection state
  const [companyHQSearchQuery, setCompanyHQSearchQuery] = useState('')
  const [companyHQSearchResults, setCompanyHQSearchResults] = useState<CompanyHQ[]>([])
  const [selectedCompanyHQ, setSelectedCompanyHQ] = useState<CompanyHQ | null>(null)
  const [showCompanyHQCreate, setShowCompanyHQCreate] = useState(false)
  const [newCompanyHQName, setNewCompanyHQName] = useState('')
  const [hasSearchedHQ, setHasSearchedHQ] = useState(false)
  const [isSearchingHQ, setIsSearchingHQ] = useState(false)

  // Company Unit selection state
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [companySearchResults, setCompanySearchResults] = useState<CompanyUnit[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyUnit | null>(null)
  const [showCompanyCreate, setShowCompanyCreate] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Division selection state
  const [divisionSearchQuery, setDivisionSearchQuery] = useState('')
  const [divisionSearchResults, setDivisionSearchResults] = useState<DivisionUnit[]>([])
  const [selectedDivision, setSelectedDivision] = useState<DivisionUnit | null>(null)
  const [showDivisionCreate, setShowDivisionCreate] = useState(false)
  const [newDivisionName, setNewDivisionName] = useState('')

  // Current profile state
  const [currentCompanyHQ, setCurrentCompanyHQ] = useState<CompanyHQ | null>(null)
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
      // New API structure: companyAffiliation with company (HQ), companyUnit, and division
      const companyAffiliation = response.data?.companyAffiliation
      if (companyAffiliation) {
        if (companyAffiliation.company) {
          setCurrentCompanyHQ(companyAffiliation.company)
          setSelectedCompanyHQ(companyAffiliation.company)
        }
        if (companyAffiliation.companyUnit) {
          setCurrentCompany(companyAffiliation.companyUnit)
          setSelectedCompany(companyAffiliation.companyUnit)
        }
        if (companyAffiliation.division) {
          setCurrentDivision(companyAffiliation.division)
          setSelectedDivision(companyAffiliation.division)
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchCompanyHQ = async (query: string) => {
    if (!query.trim()) {
      setCompanyHQSearchResults([])
      setHasSearchedHQ(false)
      return
    }

    try {
      setIsSearchingHQ(true)
      setHasSearchedHQ(true)
      const response = await api.post('/api/company-registry/search', { query })
      if (response.data.success) {
        setCompanyHQSearchResults(response.data.companies || [])
      } else {
        setCompanyHQSearchResults([])
      }
    } catch (error) {
      console.error('CompanyRegistry search failed:', error)
      setCompanyHQSearchResults([])
    } finally {
      setIsSearchingHQ(false)
    }
  }

  const createCompanyHQ = async () => {
    if (!newCompanyHQName.trim()) return

    try {
      const response = await api.post('/api/company-registry/create', { name: newCompanyHQName })
      if (response.data.success) {
        const companyHQ = response.data.company
        setSelectedCompanyHQ(companyHQ)
        setCurrentCompanyHQ(companyHQ)
        setNewCompanyHQName('')
        setShowCompanyHQCreate(false)
        setCompanyHQSearchQuery('')
        setCompanyHQSearchResults([])
        setHasSearchedHQ(false)
      }
    } catch (error: any) {
      alert(`Failed to create company HQ: ${error.response?.data?.error || error.message}`)
    }
  }

  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      setCompanySearchResults([])
      setHasSearched(false)
      return
    }

    try {
      setIsSearching(true)
      setHasSearched(true)
      const response = await api.post('/api/company-unit/search', { query })
      if (response.data.success) {
        setCompanySearchResults(response.data.companyUnits || [])
      } else {
        setCompanySearchResults([])
      }
    } catch (error) {
      console.error('CompanyUnit search failed:', error)
      setCompanySearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const createCompany = async () => {
    if (!newCompanyName.trim()) return

    try {
      // Pass companyId if Company HQ is selected
      const response = await api.post('/api/company-unit/create', { 
        name: newCompanyName,
        companyId: selectedCompanyHQ?.id || null,
      })
      if (response.data.success) {
        const company = response.data.companyUnit
        setSelectedCompany(company)
        setCurrentCompany(company)
        setNewCompanyName('')
        setShowCompanyCreate(false)
        setCompanySearchQuery('')
        setCompanySearchResults([])
        setHasSearched(false)
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
        setDivisionSearchResults(response.data.divisionUnits || [])
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
        // API returns 'division' not 'divisionUnit'
        const division = response.data.divisionUnit || response.data.division
        if (division) {
          setSelectedDivision(division)
          setCurrentDivision(division)
          setNewDivisionName('')
          setShowDivisionCreate(false)
          setDivisionSearchQuery('')
          setDivisionSearchResults([])
        } else {
          alert('Division created but response format unexpected')
        }
      }
    } catch (error: any) {
      alert(`Failed to create division: ${error.response?.data?.error || error.message}`)
    }
  }

  const saveProfile = async () => {
    // Company Unit is required, but Company HQ and Division are optional
    if (!selectedCompany) {
      alert('Please select a company unit')
      return
    }

    try {
      setSaving(true)
      // Use the new 3-field format
      const response = await api.post('/api/company-affiliation/save', {
        companyName: selectedCompanyHQ?.name || null,
        unitName: selectedCompany.name,
        divisionName: selectedDivision?.name || null,
      })

      if (response.data.success) {
        if (response.data.companyHQ) {
          setCurrentCompanyHQ(response.data.companyHQ)
        }
        setCurrentCompany(selectedCompany)
        setCurrentDivision(selectedDivision)
        alert('Company affiliation saved successfully!')
        router.push('/settings')
      }
    } catch (error: any) {
      alert(`Failed to save company affiliation: ${error.response?.data?.error || error.message}`)
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
    (selectedCompanyHQ?.id !== currentCompanyHQ?.id) ||
    (selectedCompany?.id !== currentCompany?.id) ||
    (selectedDivision?.id !== currentDivision?.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <Link
                href="/settings"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Let's lock in your company affiliations so you can add work outputs with company context.
              </h1>
            </div>

            {/* Company HQ Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-green-600" />
                Company HQ
              </h2>

              {currentCompanyHQ && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">
                      Current: {currentCompanyHQ.name}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={companyHQSearchQuery}
                    onChange={(e) => {
                      setCompanyHQSearchQuery(e.target.value)
                      searchCompanyHQ(e.target.value)
                    }}
                    placeholder="Search for company HQ..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {isSearchingHQ && (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                )}

                {!isSearchingHQ && companyHQSearchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {companyHQSearchResults.map((companyHQ) => (
                      <button
                        key={companyHQ.id}
                        onClick={() => {
                          setSelectedCompanyHQ(companyHQ)
                          setCompanyHQSearchQuery('')
                          setCompanyHQSearchResults([])
                          setHasSearchedHQ(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                          selectedCompanyHQ?.id === companyHQ.id ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                          selectedCompanyHQ?.id === companyHQ.id 
                            ? 'bg-green-600 border-green-600' 
                            : 'border-gray-300'
                        }`}>
                          {selectedCompanyHQ?.id === companyHQ.id && (
                            <div className="h-full w-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 flex-1">{companyHQ.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearchingHQ && hasSearchedHQ && companyHQSearchQuery.trim() && companyHQSearchResults.length === 0 && (
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      No company HQ found matching "{companyHQSearchQuery}"
                    </p>
                    <button
                      onClick={async () => {
                        // Automatically create and select it
                        try {
                          const response = await api.post('/api/company-registry/create', { name: companyHQSearchQuery })
                          if (response.data.success) {
                            const companyHQ = response.data.company
                            setSelectedCompanyHQ(companyHQ)
                            setCurrentCompanyHQ(companyHQ)
                            setCompanyHQSearchQuery('')
                            setCompanyHQSearchResults([])
                            setHasSearchedHQ(false)
                          }
                        } catch (error: any) {
                          alert(`Failed to create company HQ: ${error.response?.data?.error || error.message}`)
                        }
                      }}
                      className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create "{companyHQSearchQuery}" as new company HQ
                    </button>
                  </div>
                )}

                {selectedCompanyHQ && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-900">{selectedCompanyHQ.name}</span>
                      <div className="flex items-center gap-2">
                        {selectedCompanyHQ.id === currentCompanyHQ?.id && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        <button
                          onClick={() => {
                            setSelectedCompanyHQ(null)
                            setCompanyHQSearchQuery('')
                            setCompanyHQSearchResults([])
                            setHasSearchedHQ(false)
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                          title="Clear selection"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!showCompanyHQCreate && !hasSearchedHQ && (
                  <button
                    onClick={() => setShowCompanyHQCreate(true)}
                    className="flex items-center text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create new company HQ
                  </button>
                )}

                {showCompanyHQCreate && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <input
                      type="text"
                      value={newCompanyHQName}
                      onChange={(e) => setNewCompanyHQName(e.target.value)}
                      placeholder="Enter company HQ name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          createCompanyHQ()
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={createCompanyHQ}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCompanyHQCreate(false)
                          setNewCompanyHQName('')
                          setHasSearchedHQ(false)
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

            {/* Company Unit Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Company Unit
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

                {isSearching && (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                )}

                {!isSearching && companySearchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {companySearchResults.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => {
                          setSelectedCompany(company)
                          setCompanySearchQuery('')
                          setCompanySearchResults([])
                          setHasSearched(false)
                          setSelectedDivision(null) // Clear division when company changes
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                          selectedCompany?.id === company.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                          selectedCompany?.id === company.id 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          {selectedCompany?.id === company.id && (
                            <div className="h-full w-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 flex-1">{company.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && hasSearched && companySearchQuery.trim() && companySearchResults.length === 0 && (
                  <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      No company found matching "{companySearchQuery}"
                    </p>
                    <button
                      onClick={async () => {
                        // Automatically create and select it (link to Company HQ if selected)
                        try {
                          const response = await api.post('/api/company-unit/create', { 
                            name: companySearchQuery,
                            companyId: selectedCompanyHQ?.id || null,
                          })
                          if (response.data.success) {
                            const company = response.data.companyUnit
                            setSelectedCompany(company)
                            setCurrentCompany(company)
                            setCompanySearchQuery('')
                            setCompanySearchResults([])
                            setHasSearched(false)
                            // Clear division when company changes
                            setSelectedDivision(null)
                            setCurrentDivision(null)
                          }
                        } catch (error: any) {
                          alert(`Failed to create company: ${error.response?.data?.error || error.message}`)
                        }
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create "{companySearchQuery}" as new company
                    </button>
                  </div>
                )}

                {selectedCompany && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-900">{selectedCompany.name}</span>
                      <div className="flex items-center gap-2">
                        {selectedCompany.id === currentCompany?.id && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        <button
                          onClick={() => {
                            setSelectedCompany(null)
                            setCompanySearchQuery('')
                            setCompanySearchResults([])
                            setHasSearched(false)
                            setSelectedDivision(null)
                            setCurrentDivision(null)
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                          title="Clear selection"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!showCompanyCreate && !hasSearched && (
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
                          setHasSearched(false)
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
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                            selectedDivision?.id === division.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                            selectedDivision?.id === division.id 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'border-gray-300'
                          }`}>
                            {selectedDivision?.id === division.id && (
                              <div className="h-full w-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                          <div className="font-medium text-gray-900 flex-1">{division.name}</div>
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

            {/* Save Button - Show if there are changes OR if company unit is selected */}
            {(hasChanges || selectedCompany) && (
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
                    'Save Company Affiliation'
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

