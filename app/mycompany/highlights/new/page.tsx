'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Sparkles, ArrowLeft, Search, UserPlus, Check } from 'lucide-react'
import api from '@/lib/api'
import { HighlightClassification, classificationConfig, mapStringToClassification } from '@/lib/config/highlightClassification'

interface Employee {
  id: string
  fullName: string
  title?: string | null
  email?: string | null
  companyUnit?: string | null
}

interface ParsedHighlight {
  citationText: string
  achievement?: string | null
  narrative?: string | null
  classification?: HighlightClassification | string | null
  awardName?: string | null
  awardingAgency?: string | null
  awardYear?: number | null
  supervisorQuote?: string | null
  photoUrl?: string | null
}

type Step = 'employee' | 'ingest' | 'review'

export default function NewHighlightPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('employee')
  
  // Step 1: Employee selection
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    title: '',
    email: '',
    companyUnit: '',
  })
  
  // Step 2: Citation ingestion
  const [rawText, setRawText] = useState('')
  const [parsedHighlight, setParsedHighlight] = useState<ParsedHighlight | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  
  // General
  const [loading, setLoading] = useState(false)
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

  // Employee search
  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHasSearched(false)
      setShowCreateForm(false)
      return
    }

    setSearching(true)
    setHasSearched(false)
    try {
      const response = await api.get(`/api/employee/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (response.data.success) {
        const employees = response.data.employees || []
        setSearchResults(employees)
        setHasSearched(true)
        // If no results, show prompt to create
        if (employees.length === 0) {
          setShowCreateForm(true)
        } else {
          setShowCreateForm(false)
        }
      }
    } catch (err: any) {
      console.error('Failed to search employees:', err)
      setSearchResults([])
      setHasSearched(true)
      setShowCreateForm(true)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      } else {
        setSearchResults([])
        setHasSearched(false)
        setShowCreateForm(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Create new employee
  async function handleCreateEmployee() {
    if (!newEmployee.fullName.trim()) {
      setError('Full name is required')
      return
    }

    setCreatingEmployee(true)
    setError(null)

    try {
      const response = await api.post('/api/employee/create', {
        fullName: newEmployee.fullName.trim(),
        title: newEmployee.title.trim() || undefined,
        email: newEmployee.email.trim() || undefined,
        companyUnit: newEmployee.companyUnit.trim() || undefined,
      })

      if (response.data.success) {
        const employee = response.data.employee
        setSelectedEmployee({
          id: employee.id,
          fullName: employee.fullName,
          title: employee.title,
          email: employee.email,
          companyUnit: employee.companyUnit,
        })
        setNewEmployee({ fullName: '', title: '', email: '', companyUnit: '' })
        setShowCreateForm(false)
        setHasSearched(false)
        setSearchQuery('')
      } else {
        setError(response.data.error || 'Failed to create employee')
      }
    } catch (err: any) {
      console.error('Failed to create employee:', err)
      setError(err.response?.data?.error || err.message || 'Failed to create employee')
    } finally {
      setCreatingEmployee(false)
    }
  }

  // Continue to ingest step
  function handleContinueToIngest() {
    if (!selectedEmployee) {
      setError('Please select or create an employee')
      return
    }
    // Ensure unit is set
    if (!selectedEmployee.companyUnit || !selectedEmployee.companyUnit.trim()) {
      setError('Please specify the employee\'s unit')
      return
    }
    setError(null)
    setStep('ingest')
  }

  // Ingest citation
  async function handleExtract() {
    if (!rawText.trim()) {
      setError('Please enter citation text')
      return
    }

    if (!selectedEmployee) {
      setError('Employee must be selected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/company/highlights/ingest', {
        text: rawText.trim(),
        employeeId: selectedEmployee.id,
        unit: selectedEmployee.companyUnit || undefined,
      })

      if (response.data.success) {
        const highlight = response.data.highlight
        // Map string classification to enum if needed
        const mappedClassification = highlight.classification 
          ? (mapStringToClassification(highlight.classification) || highlight.classification)
          : null
        setParsedHighlight({ ...highlight, classification: mappedClassification })
        setHighlightId(highlight.id)
        setStep('review')
      } else {
        setError(response.data.error || 'Failed to extract highlight')
      }
    } catch (err: any) {
      console.error('Failed to extract highlight:', err)
      setError(err.response?.data?.error || err.message || 'Failed to extract highlight')
    } finally {
      setLoading(false)
    }
  }

  // Save highlight
  async function handleSave() {
    if (!parsedHighlight || !highlightId || !selectedEmployee) return

    setLoading(true)
    setError(null)

    try {
      const response = await api.post('/api/company/highlights/save', {
        highlightId,
        employeeId: selectedEmployee.id,
        highlight: parsedHighlight,
      })

      if (response.data.success) {
        router.push(`/mycompany/highlights/${highlightId}`)
      } else {
        setError(response.data.error || 'Failed to save highlight')
      }
    } catch (err: any) {
      console.error('Failed to save highlight:', err)
      setError(err.response?.data?.error || err.message || 'Failed to save highlight')
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
            <Link
              href="/mycompany/highlights"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Highlights
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center mb-6">
                <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
                <h1 className="text-3xl font-bold text-gray-900">Add Employee Highlight</h1>
              </div>

              {/* Step indicator */}
              <div className="flex items-center mb-6 pb-6 border-b">
                <div className={`flex items-center ${step === 'employee' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'employee' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {selectedEmployee ? <Check className="h-5 w-5" /> : '1'}
                  </div>
                  <span className="ml-2 font-medium">Select Employee</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
                <div className={`flex items-center ${step === 'ingest' || step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'ingest' || step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {parsedHighlight ? <Check className="h-5 w-5" /> : '2'}
                  </div>
                  <span className="ml-2 font-medium">Add Citation</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {/* Step 1: Employee Selection */}
              {step === 'employee' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Who is getting this highlight?</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Search for an existing employee or create a new one. Then specify their unit.
                    </p>
                  </div>

                  {/* Search existing employees */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Existing Employees
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type employee name to search..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    {searching && (
                      <div className="mt-2 text-sm text-gray-500">Searching...</div>
                    )}

                    {hasSearched && searchResults.length === 0 && !searching && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <UserPlus className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              No employees found for "{searchQuery}"
                            </p>
                            <p className="text-sm text-blue-700 mb-3">
                              Would you like to create a new employee profile?
                            </p>
                            <button
                              onClick={() => {
                                setShowCreateForm(true)
                                // Pre-fill the name from search query
                                setNewEmployee({ ...newEmployee, fullName: searchQuery })
                                // Scroll to create form
                                setTimeout(() => {
                                  const createForm = document.getElementById('create-employee-form')
                                  createForm?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  const nameInput = document.getElementById('new-employee-name')
                                  nameInput?.focus()
                                }, 100)
                              }}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create New Employee
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                        {searchResults.map((employee) => (
                          <button
                            key={employee.id}
                            onClick={() => {
                              setSelectedEmployee(employee)
                              setSearchQuery('')
                              setSearchResults([])
                              setHasSearched(false)
                              setShowCreateForm(false)
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              selectedEmployee?.id === employee.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="font-medium text-gray-900">{employee.fullName}</div>
                            {employee.title && (
                              <div className="text-sm text-gray-500">{employee.title}</div>
                            )}
                            {employee.companyUnit && (
                              <div className="text-xs text-gray-400">Unit: {employee.companyUnit}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Divider - only show if not showing create form prompt */}
                  {(!hasSearched || searchResults.length > 0) && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">OR</span>
                      </div>
                    </div>
                  )}

                  {/* Create new employee */}
                  <div id="create-employee-form" className={showCreateForm ? 'ring-2 ring-blue-500 rounded-lg p-4 bg-blue-50/30' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Create New Employee
                    </label>
                    <div className="space-y-3">
                      <input
                        id="new-employee-name"
                        type="text"
                        value={newEmployee.fullName}
                        onChange={(e) => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                        placeholder="Full Name *"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={newEmployee.title}
                        onChange={(e) => setNewEmployee({ ...newEmployee, title: e.target.value })}
                        placeholder="Title (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        placeholder="Email (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={newEmployee.companyUnit}
                        onChange={(e) => setNewEmployee({ ...newEmployee, companyUnit: e.target.value })}
                        placeholder="Unit (e.g., SEA 05, SEA08D1) *"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleCreateEmployee}
                        disabled={creatingEmployee || !newEmployee.fullName.trim() || !newEmployee.companyUnit.trim()}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {creatingEmployee ? 'Creating...' : 'Create Employee'}
                      </button>
                    </div>
                  </div>

                  {/* Selected employee display */}
                  {selectedEmployee && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-blue-900">{selectedEmployee.fullName}</div>
                          {selectedEmployee.title && (
                            <div className="text-sm text-blue-700">{selectedEmployee.title}</div>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedEmployee(null)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Change
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Unit <span className="text-red-500">*</span>
                          {selectedEmployee.companyUnit && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">(locked from employee profile)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={selectedEmployee.companyUnit || ''}
                          onChange={(e) => {
                            setSelectedEmployee({ ...selectedEmployee, companyUnit: e.target.value })
                          }}
                          placeholder="SEA 05, SEA08D1, etc."
                          disabled={!!selectedEmployee.companyUnit}
                          className={`w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            selectedEmployee.companyUnit 
                              ? 'bg-gray-100 text-gray-700 cursor-not-allowed' 
                              : 'bg-white'
                          }`}
                        />
                        {selectedEmployee.companyUnit && (
                          <p className="mt-1 text-xs text-blue-600">
                            This employee's unit is set. Click "Change" above to select a different employee.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Continue button */}
                  <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                    <Link
                      href="/mycompany/highlights"
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </Link>
                    <button
                      onClick={handleContinueToIngest}
                      disabled={!selectedEmployee || !selectedEmployee.companyUnit?.trim()}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Citation
                      <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Citation Ingestion */}
              {step === 'ingest' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Add Citation Text</h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Paste the award citation or recognition text. AI will extract the highlight details.
                    </p>
                    {selectedEmployee && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Employee:</span> {selectedEmployee.fullName}
                          {selectedEmployee.companyUnit && (
                            <> • <span className="font-medium">Unit:</span> {selectedEmployee.companyUnit}</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-2">
                      Paste Award Citation or Highlight Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rawText"
                      rows={12}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Paste the full award citation, recognition text, or highlight writeup here..."
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Note: Photos can be attached after saving. The design team will handle photo integration.
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                    <button
                      onClick={() => setStep('employee')}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleExtract}
                      disabled={loading || !rawText.trim()}
                      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Extract with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 'review' && parsedHighlight && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
                    <p className="font-medium">Review and edit the extracted highlight details:</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Award Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Award Name</label>
                          <input
                            type="text"
                            value={parsedHighlight.awardName || ''}
                            onChange={(e) => setParsedHighlight({ ...parsedHighlight, awardName: e.target.value || null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Awarding Agency</label>
                          <input
                            type="text"
                            value={parsedHighlight.awardingAgency || ''}
                            onChange={(e) => setParsedHighlight({ ...parsedHighlight, awardingAgency: e.target.value || null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                          <input
                            type="number"
                            value={parsedHighlight.awardYear || ''}
                            onChange={(e) => setParsedHighlight({ ...parsedHighlight, awardYear: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
                          <select
                            value={
                              parsedHighlight.classification && 
                              Object.values(HighlightClassification).includes(parsedHighlight.classification as HighlightClassification)
                                ? parsedHighlight.classification 
                                : ''
                            }
                            onChange={(e) => {
                              const value = e.target.value as HighlightClassification | ''
                              setParsedHighlight({ ...parsedHighlight, classification: value || null })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select classification...</option>
                            {Object.values(HighlightClassification).map((classification) => {
                              const config = classificationConfig[classification]
                              return (
                                <option key={classification} value={classification}>
                                  {config.label} - {config.description}
                                </option>
                              )
                            })}
                          </select>
                          {parsedHighlight.classification && 
                           Object.values(HighlightClassification).includes(parsedHighlight.classification as HighlightClassification) && (
                            <p className="mt-1 text-xs text-gray-500">
                              {classificationConfig[parsedHighlight.classification as HighlightClassification]?.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Achievement Summary</label>
                    <textarea
                      rows={2}
                      value={parsedHighlight.achievement || ''}
                      onChange={(e) => setParsedHighlight({ ...parsedHighlight, achievement: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Citation Text</label>
                    <textarea
                      rows={6}
                      value={parsedHighlight.citationText}
                      onChange={(e) => setParsedHighlight({ ...parsedHighlight, citationText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                    <button
                      onClick={() => setStep('ingest')}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Highlight'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
