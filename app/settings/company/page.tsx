'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import Link from 'next/link'
import api from '@/lib/api'
import { refreshWorkMe } from '@/lib/workme.client'
import { Building2, Search, Plus, ArrowRight, Loader2, ArrowLeft, Edit } from 'lucide-react'

interface Company {
  id: string
  name: string
  city?: string | null
  state?: string | null
  industry?: string | null
}

export default function CompanySettingsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [showEditMode, setShowEditMode] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    city: '',
    state: '',
    industry: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        loadCurrentCompany()
      }
    }
  }, [router])

  const loadCurrentCompany = async () => {
    try {
      const response = await api.get('/api/workme/profile')
      if (response.data?.workMe?.companyId) {
        const companyId = response.data.workMe.companyId
        // Fetch company details
        try {
          const companyResponse = await api.get(`/api/company/${companyId}`)
          if (companyResponse.data?.success && companyResponse.data?.company) {
            setCurrentCompany(companyResponse.data.company)
          }
        } catch (companyError) {
          console.log('Failed to fetch company details:', companyError)
          // If we can't fetch details, at least we know they have a company
          // They can edit to select a new one
        }
      }
    } catch (error) {
      console.log('No current company found or error loading:', error)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await api.post('/api/company/search', { query })
      if (response.data?.success) {
        setSearchResults(response.data.companies || [])
      }
    } catch (error: any) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    handleSearch(value)
  }

  const handleSelectCompany = async (company: Company) => {
    setLoading(true)
    try {
      await api.post('/api/company/select', { companyId: company.id })
      // Refresh WorkMe in localStorage after company selection
      await refreshWorkMe()
      setCurrentCompany(company)
      setShowEditMode(false)
      setSearchQuery('')
      setSearchResults([])
      // Refresh to show updated company
      await loadCurrentCompany()
    } catch (error: any) {
      console.error('Failed to select company:', error)
      alert(`Failed to select company: ${error.response?.data?.error || error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createFormData.name.trim()) {
      alert('Company name is required')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/company/create', {
        name: createFormData.name.trim(),
        city: createFormData.city.trim() || undefined,
        state: createFormData.state.trim() || undefined,
        industry: createFormData.industry.trim() || undefined,
      })

      if (response.data?.success && response.data?.company) {
        // Automatically select the newly created company
        await api.post('/api/company/select', { companyId: response.data.company.id })
        // Refresh WorkMe in localStorage after company creation and selection
        await refreshWorkMe()
        setCurrentCompany(response.data.company)
        setShowCreateForm(false)
        setShowEditMode(false)
        setCreateFormData({ name: '', city: '', state: '', industry: '' })
        // Refresh to show updated company
        await loadCurrentCompany()
      }
    } catch (error: any) {
      console.error('Failed to create company:', error)
      alert(`Failed to create company: ${error.response?.data?.error || error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back to Settings */}
            <Link
              href="/settings"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Back to Settings</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Company Affiliation
              </h1>
              <p className="text-gray-600">
                Let's lock in your company affiliation so you can add work outputs with company context.
              </p>
            </div>

            {/* Current Company Display or Edit Mode */}
            {!showEditMode && currentCompany ? (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center flex-1">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Company HQ</h3>
                      <div className="text-gray-900 font-medium">{currentCompany.name}</div>
                      {(currentCompany.city || currentCompany.state) && (
                        <div className="text-sm text-gray-600 mt-1">
                          {[currentCompany.city, currentCompany.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {currentCompany.industry && (
                        <div className="text-sm text-gray-500 mt-1">{currentCompany.industry}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                {!showCreateForm ? (
                  <>
                    {/* Search Section */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search for your company
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSearchChange}
                          placeholder="Type company name..."
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searching && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                        )}
                      </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mb-6 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                        {searchResults.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => handleSelectCompany(company)}
                            disabled={loading}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0 disabled:opacity-50"
                          >
                            <div className="font-semibold text-gray-900">{company.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {[company.city, company.state].filter(Boolean).join(', ')}
                              {company.industry && ` • ${company.industry}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Create New Company Button */}
                    <div className="border-t border-gray-200 pt-6">
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="font-medium">Create a new company</span>
                      </button>
                    </div>

                    {/* Cancel button if in edit mode */}
                    {showEditMode && (
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            setShowEditMode(false)
                            setSearchQuery('')
                            setSearchResults([])
                          }}
                          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Create Company Form */}
                    <form onSubmit={handleCreateCompany} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={createFormData.name}
                          onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                          placeholder="e.g. Acme Corporation"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={createFormData.city}
                            onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                            placeholder="e.g. San Francisco"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={createFormData.state}
                            onChange={(e) => setCreateFormData({ ...createFormData, state: e.target.value })}
                            placeholder="e.g. CA"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <input
                          type="text"
                          value={createFormData.industry}
                          onChange={(e) => setCreateFormData({ ...createFormData, industry: e.target.value })}
                          placeholder="e.g. Technology, Healthcare, Finance"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false)
                            setCreateFormData({ name: '', city: '', state: '', industry: '' })
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                        >
                          Back to Search
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !createFormData.name.trim()}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Creating...</span>
                            </>
                          ) : (
                            <>
                              <span>Create Company</span>
                              <ArrowRight className="h-5 w-5" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}




