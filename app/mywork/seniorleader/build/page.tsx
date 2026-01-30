'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, FileText, Clipboard, Search, UserPlus } from 'lucide-react'
import api from '@/lib/api'

type Mode = 'choice' | 'ingest' | 'create'

type SeniorLeaderRole = 'SES' | 'DIRECTOR' | 'DEPUTY_DIRECTOR' | 'EXECUTIVE_DIRECTOR' | 'CHIEF' | 'DEPUTY_CHIEF' | 'COMMANDER' | 'DEPUTY_COMMANDER' | 'OTHER'

interface Employee {
  id: string
  fullName: string
  title: string | null
  email: string | null
  companyUnit: string | null
}

export default function SeniorLeaderBuildPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choice')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    actualSubjectLine: '',
    role: '' as SeniorLeaderRole | '',
    companyEmployeeId: '',
    content: '',
  })
  const [selectedRole, setSelectedRole] = useState<SeniorLeaderRole | ''>('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [enrichingFromApollo, setEnrichingFromApollo] = useState(false)
  const [apolloEmail, setApolloEmail] = useState('')
  const [apolloLinkedInUrl, setApolloLinkedInUrl] = useState('')
  const [apolloResponse, setApolloResponse] = useState<any>(null)

  // Lookup employees by role
  const handleRoleChange = async (role: SeniorLeaderRole) => {
    setSelectedRole(role)
    setFormData({ ...formData, role, companyEmployeeId: '' })
    setSelectedEmployee(null)
    setEmployees([])

    if (!role) return

    try {
      setLoadingEmployees(true)
      const response = await api.get(`/api/employee/lookup-by-role?role=${role}`)
      
      if (response.data.success) {
        setEmployees(response.data.employees || [])
      } else {
        console.error('Failed to lookup employees:', response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to lookup employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Enrich from Apollo
  const handleEnrichFromApollo = async () => {
    if (!apolloEmail.trim() && !apolloLinkedInUrl.trim()) {
      alert('Please enter an email address or LinkedIn URL')
      return
    }

    try {
      setEnrichingFromApollo(true)
      const response = await api.post('/api/employee/ingest', {
        email: apolloEmail.trim() || undefined,
        linkedinUrl: apolloLinkedInUrl.trim() || undefined,
      })

      if (response.data.success) {
        // Store Apollo response for preview
        setApolloResponse(response.data.rawApolloResponse)
        const person = response.data.person
        
        if (person) {
          // Auto-populate form with Apollo data
          const fullName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim()
          alert(`Found: ${fullName} - Review the data below and save when ready`)
        } else {
          alert('Apollo returned data but no person found')
        }
      } else {
        alert(response.data.error || 'Failed to enrich from Apollo')
      }
    } catch (error: any) {
      console.error('Failed to enrich from Apollo:', error)
      alert(error.response?.data?.error || 'Failed to enrich from Apollo')
    } finally {
      setEnrichingFromApollo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.content.trim()) {
      alert('Content is required')
      return
    }

    if (!formData.role) {
      alert('Role is required')
      return
    }

    try {
      setLoading(true)
      // Create ProductSeniorLeaderEmail (product artifact) + auto-parse topics
      const response = await api.post('/api/mywork/senior-leader-email/create', {
        title: formData.title || undefined,
        actualSubjectLine: formData.actualSubjectLine || undefined,
        content: formData.content,
        role: formData.role,
        companyEmployeeId: formData.companyEmployeeId || undefined,
      })

      if (response.data.success) {
        // Redirect back to products page (product is created with topics)
        router.push('/mywork/products')
      } else {
        alert('Failed to create senior leader email')
      }
    } catch (error: any) {
      console.error('Failed to create senior leader email:', error)
      alert(error.response?.data?.error || 'Failed to create senior leader email')
    } finally {
      setLoading(false)
    }
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
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/mywork/products"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              {mode === 'choice' ? (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Senior Leader Email</h1>
                  <p className="text-gray-600 mb-8">How do you want to add this email?</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <button
                      onClick={() => setMode('ingest')}
                      className="group p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center mb-3">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg mr-4">
                          <Clipboard className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Ingest Existing</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Copy/paste an email that someone else worked on. Store it as raw content and parse topics.
                      </p>
                    </button>

                    <button
                      onClick={() => setMode('create')}
                      className="group p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center mb-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Create New</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Create a new senior leader email artifact from scratch. Add metadata and content manually.
                      </p>
                    </button>
                  </div>

                  <Link
                    href="/mywork/products"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    ← Back to Products
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {mode === 'ingest' ? 'Ingest Existing Email' : 'Create New Email'}
                      </h1>
                      <p className="text-gray-600 mt-1">
                        {mode === 'ingest' 
                          ? 'Paste the email content below. It will be stored and topics will be parsed automatically.'
                          : 'Fill in the details to create a new senior leader email artifact.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setMode('choice')}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Change option
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Title (optional)
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter a title for this email"
                      />
                    </div>

                    <div>
                      <label htmlFor="actualSubjectLine" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line (optional)
                      </label>
                      <input
                        type="text"
                        id="actualSubjectLine"
                        value={formData.actualSubjectLine}
                        onChange={(e) => setFormData({ ...formData, actualSubjectLine: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter the email subject line"
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="role"
                        value={selectedRole}
                        onChange={(e) => handleRoleChange(e.target.value as SeniorLeaderRole)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a role...</option>
                        <option value="SES">SES</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="DEPUTY_DIRECTOR">Deputy Director</option>
                        <option value="EXECUTIVE_DIRECTOR">Executive Director</option>
                        <option value="CHIEF">Chief</option>
                        <option value="DEPUTY_CHIEF">Deputy Chief</option>
                        <option value="COMMANDER">Commander</option>
                        <option value="DEPUTY_COMMANDER">Deputy Commander</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    {selectedRole && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Person
                        </label>
                        
                        {loadingEmployees ? (
                          <div className="text-sm text-gray-500">Loading employees...</div>
                        ) : employees.length > 0 ? (
                          <div className="space-y-2">
                            <select
                              value={formData.companyEmployeeId}
                              onChange={(e) => {
                                const employee = employees.find(emp => emp.id === e.target.value)
                                setSelectedEmployee(employee || null)
                                setFormData({ ...formData, companyEmployeeId: e.target.value })
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select a person...</option>
                              {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.fullName} {emp.title ? `- ${emp.title}` : ''}
                                </option>
                              ))}
                            </select>
                            
                            {selectedEmployee && (
                              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                                <div className="font-medium">{selectedEmployee.fullName}</div>
                                {selectedEmployee.title && <div className="text-gray-600">{selectedEmployee.title}</div>}
                                {selectedEmployee.email && <div className="text-gray-600">{selectedEmployee.email}</div>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-3">No employees found for this role.</div>
                        )}

                        {/* Apollo Enrichment */}
                        <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-center mb-2">
                            <UserPlus className="h-4 w-4 mr-2 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Enrich from Apollo</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Enter email or LinkedIn URL to find and enrich person data
                          </p>
                          <div className="space-y-2">
                            <input
                              type="email"
                              value={apolloEmail}
                              onChange={(e) => setApolloEmail(e.target.value)}
                              placeholder="Email address (or use LinkedIn URL below)"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="text-xs text-gray-500 text-center">OR</div>
                            <input
                              type="url"
                              value={apolloLinkedInUrl}
                              onChange={(e) => setApolloLinkedInUrl(e.target.value)}
                              placeholder="LinkedIn URL (e.g., https://linkedin.com/in/...)"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={handleEnrichFromApollo}
                              disabled={enrichingFromApollo || (!apolloEmail.trim() && !apolloLinkedInUrl.trim())}
                              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {enrichingFromApollo ? 'Enriching...' : 'Enrich from Apollo'}
                            </button>
                          </div>
                          {apolloResponse && (
                            <div className="mt-4 p-3 bg-white border border-gray-200 rounded text-xs">
                              <div className="font-semibold mb-2">Apollo Response:</div>
                              <pre className="overflow-auto max-h-40 text-xs">
                                {JSON.stringify(apolloResponse, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={20}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="Paste the full email or text content here..."
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        {mode === 'ingest' 
                          ? 'Paste the complete email. It will be stored as raw content and topics will be parsed automatically.'
                          : 'Paste the complete email or text. This will be stored as raw, immutable content.'}
                      </p>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Link
                        href="/mywork/products"
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={loading || !formData.content.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : mode === 'ingest' ? 'Ingest & Parse Topics' : 'Create & Parse Topics'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

