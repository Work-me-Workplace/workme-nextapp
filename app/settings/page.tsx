'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import TopNav from '@/components/layout/TopNav'
import Link from 'next/link'
import { Building2, User, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)

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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

