'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'

export default function TopNav() {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const firebaseUser = getAuth().currentUser
    if (firebaseUser?.photoURL) {
      setUserPhoto(firebaseUser.photoURL)
    }

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = () => {
    localStorage.clear()
    router.push('/signin')
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xl font-bold text-gray-900">Work.me</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/profile"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt="Profile"
                        className="h-6 w-6 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <User className="h-4 w-4 mr-3" />
                    )}
                    Your Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

