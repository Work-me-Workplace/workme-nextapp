'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, UserPlus, Search } from 'lucide-react'
import api from '@/lib/api'

type SeniorLeaderRole = 'SES' | 'DIRECTOR' | 'DEPUTY_DIRECTOR' | 'EXECUTIVE_DIRECTOR' | 'CHIEF' | 'DEPUTY_CHIEF' | 'COMMANDER' | 'DEPUTY_COMMANDER' | 'OTHER'

export default function NewSeniorLeaderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [enrichingFromApollo, setEnrichingFromApollo] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    companyUnit: '',
    role: '' as SeniorLeaderRole | '',
  })
  const [apolloSearchName, setApolloSearchName] = useState('')

  const handleEnrichFromApollo = async () => {
    if (!apolloSearchName.trim()) {
      alert('Please enter a name to search')
      return
    }

    try {
      setEnrichingFromApollo(true)
      const response = await api.post('/api/employee/enrich-from-apollo', {
        fullName: apolloSearchName.trim(),
        role: formData.role || undefined,
      })

      if (response.data.success) {
        const employee = response.data.employee
        const apolloData = response.data.apolloData
        
        // Populate form with Apollo data
        setFormData({
          fullName: employee.fullName,
          title: apolloData.title || employee.title || '',
          email: employee.email || '',
          phone: '',
          companyUnit: employee.companyUnit || '',
          role: formData.role,
        })
        
        setApolloSearchName('')
        alert(`Successfully enriched: ${employee.fullName}`)
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
    
    if (!formData.fullName.trim()) {
      alert('Full name is required')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/api/employee/create', {
        fullName: formData.fullName.trim(),
        title: formData.title.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        companyUnit: formData.companyUnit.trim() || undefined,
      })

      if (response.data.success) {
        // Redirect back to senior leaders list
        router.push('/mycompany/senior-leaders')
      } else {
        alert(response.data.error || 'Failed to create senior leader')
      }
    } catch (error: any) {
      console.error('Failed to create senior leader:', error)
      alert(error.response?.data?.error || 'Failed to create senior leader')
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
              href="/mycompany/senior-leaders"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Senior Leaders
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Senior Leader</h1>
              <p className="text-gray-600 mb-8">Create a new senior leader employee record</p>

              {/* Apollo Enrichment */}
              <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center mb-2">
                  <UserPlus className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Enrich from Apollo</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Search Apollo to auto-populate employee data
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apolloSearchName}
                    onChange={(e) => setApolloSearchName(e.target.value)}
                    placeholder="Enter full name to search..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleEnrichFromApollo}
                    disabled={enrichingFromApollo || !apolloSearchName.trim()}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrichingFromApollo ? 'Enriching...' : 'Enrich'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter job title"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      Role Category
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as SeniorLeaderRole })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select role...</option>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyUnit" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Unit
                  </label>
                  <input
                    type="text"
                    id="companyUnit"
                    value={formData.companyUnit}
                    onChange={(e) => setFormData({ ...formData, companyUnit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company unit"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Link
                    href="/mycompany/senior-leaders"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Senior Leader'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


