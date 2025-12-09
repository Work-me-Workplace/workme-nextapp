'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import Link from 'next/link'
import { Building2, User, Bell, Shield, Download, Upload, Database } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle')
  const [localStorageJson, setLocalStorageJson] = useState<string>('')

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

  const exportLocalStorage = () => {
    if (typeof window === 'undefined') return

    try {
      setExportStatus('exporting')
      
      // Collect all localStorage data
      const data: Record<string, any> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              // Try to parse as JSON, fallback to string
              try {
                data[key] = JSON.parse(value)
              } catch {
                data[key] = value
              }
            }
          } catch (e) {
            console.warn(`Failed to read key ${key}:`, e)
          }
        }
      }

      // Format as JSON
      const jsonData = {
        localStorage: data,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      }

      setLocalStorageJson(JSON.stringify(jsonData, null, 2))
      setExportStatus('success')
    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('error')
      setTimeout(() => setExportStatus('idle'), 3000)
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
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account and preferences</p>
            </div>

            <div className="space-y-4">
              {/* Company Settings */}
              <Link
                href="/settings/company"
                className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Company & Division</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your company and division affiliation
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Profile Settings (Future) */}
              <div className="block bg-white rounded-lg shadow p-6 opacity-50">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Profile Preferences</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Coming soon
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Settings (Future) */}
              <div className="block bg-white rounded-lg shadow p-6 opacity-50">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Coming soon
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Settings (Future) */}
              <div className="block bg-white rounded-lg shadow p-6 opacity-50">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                    <Shield className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Coming soon
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Export */}
              <div className="block bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Local Storage Export</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Export your localStorage data as JSON for migration
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={exportLocalStorage}
                    disabled={exportStatus === 'exporting'}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {exportStatus === 'exporting' ? 'Exporting...' : 'Get Local Storage JSON'}
                  </button>

                  {exportStatus === 'success' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Copy this JSON:
                      </label>
                      <textarea
                        id="localStorageJson"
                        readOnly
                        className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-xs bg-gray-50 resize-none"
                        value={localStorageJson}
                        onClick={(e) => {
                          e.currentTarget.select()
                          navigator.clipboard.writeText(localStorageJson).then(() => {
                            // Show brief feedback
                            const btn = e.currentTarget
                            const originalBg = btn.className
                            btn.className = btn.className.replace('bg-gray-50', 'bg-green-100')
                            setTimeout(() => {
                              btn.className = originalBg
                            }, 500)
                          })
                        }}
                        onFocus={(e) => {
                          e.currentTarget.select()
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Click the textarea to select all, then copy (Cmd/Ctrl+C)
                      </p>
                    </div>
                  )}

                  {exportStatus === 'error' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">Error exporting localStorage. Please try again.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

