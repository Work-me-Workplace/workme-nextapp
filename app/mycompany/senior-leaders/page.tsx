'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { ArrowLeft, UserPlus, Search, Mail } from 'lucide-react'
import api from '@/lib/api'

interface Employee {
  id: string
  fullName: string
  title: string | null
  email: string | null
  companyUnit: string | null
}

export default function SeniorLeadersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')

  useEffect(() => {
    loadEmployees()
  }, [filterRole])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      
      if (filterRole) {
        // Load by role
        const response = await api.get(`/api/employee/lookup-by-role?role=${filterRole}`)
        if (response.data.success) {
          setEmployees(response.data.employees || [])
        }
      } else if (searchQuery) {
        // Search by query
        const response = await api.get(`/api/employee/search?q=${searchQuery}`)
        if (response.data.success) {
          setEmployees(response.data.employees || [])
        }
      } else {
        // Load all - use search with empty query to get all
        const response = await api.get(`/api/employee/search?q=`)
        if (response.data.success) {
          setEmployees(response.data.employees || [])
        }
      }
    } catch (error: any) {
      console.error('Failed to load employees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [searchQuery])

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      emp.fullName.toLowerCase().includes(query) ||
      emp.title?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query)
    )
  })

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/mycompany"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to MyCompany
            </Link>

            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Senior Leaders</h1>
                  <p className="text-gray-600 mt-1">Manage senior leader employees for email tracking</p>
                </div>
                <Link
                  href="/mycompany/senior-leaders/new"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Senior Leader
                </Link>
              </div>

              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, title, or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value)
                    setSearchQuery('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
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

              {/* Employee List */}
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No senior leaders found</p>
                  <Link
                    href="/mycompany/senior-leaders/new"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Create your first senior leader →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {employee.fullName}
                            </h3>
                            {employee.title && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                {employee.title}
                              </span>
                            )}
                          </div>
                          {employee.email && (
                            <p className="text-sm text-gray-600 mt-1">{employee.email}</p>
                          )}
                          {employee.companyUnit && (
                            <p className="text-xs text-gray-500 mt-1">Unit: {employee.companyUnit}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/mywork/seniorleader/build?role=${filterRole || 'OTHER'}&employeeId=${employee.id}`}
                            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Create Email
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}




