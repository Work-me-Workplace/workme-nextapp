'use client'

import './globals.css'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') return pathname === path
    return pathname?.startsWith(path)
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xl font-bold text-gray-900">Work.me</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/connections" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Connections
                </Link>
                <Link href="/events" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Events
                </Link>
                <Link href="/milestones" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Milestones
                </Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex">
          <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
            <nav className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Achievements
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/achievements"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/achievements') && !pathname?.includes('/achievements/')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      All Achievements
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/achievements/new"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/achievements/new')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      Add Manually
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/achievements/upload"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/achievements/upload')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      Upload CSV
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/comms-outputs"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/comms-outputs')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      Communication Outputs
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/activities"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/activities')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      Organizational Activities
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/happenings"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/happenings')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      Events & Happenings
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/objectives"
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/objectives')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      Objectives
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
