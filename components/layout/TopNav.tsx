'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getAuth } from 'firebase/auth'
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  Target,
  Award,
  BookOpen,
  Network,
  UserPlus,
  Calendar,
  FileText,
  TrendingUp,
  CheckSquare,
  Radio,
  Search,
  Mail,
  Twitter,
  Newspaper,
  BarChart3,
  Presentation,
  Camera,
  ArrowDown,
  Package,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  History,
  Image as ImageIcon,
  LayoutDashboard,
} from 'lucide-react'

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
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
      // Close dropdowns when clicking outside
      if (activeDropdown) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  const handleSignOut = () => {
    localStorage.clear()
    router.push('/signin')
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path
    if (path === '/mywork') {
      // Only match exactly /mywork or /mywork/, not /mywork/* sub-pages
      const isExactMatch = pathname === path || pathname === '/mywork/'
      return isExactMatch
    }
    return pathname?.startsWith(path)
  }

  const navigationGroups = [
    {
      name: 'My Company',
      icon: Users,
      items: [
        { name: 'Workforce Stuff', path: '/mycompany/workforcestuff', icon: Users },
        { name: 'Milestones', path: '/mycompany/milestones', icon: TrendingUp },
        { name: 'Highlights', path: '/mycompany/highlights', icon: Award },
        { name: 'Senior Leaders', path: '/mycompany/senior-leaders', icon: UserPlus },
        { name: 'Products', path: '/mycompany/products', icon: Package },
        { name: 'Pressures', path: '/mycompany/external-pressures', icon: AlertTriangle },
      ],
    },
    {
      name: 'My Work',
      icon: CheckSquare,
      items: [
        { name: 'My Work', path: '/mywork', icon: LayoutDashboard },
        { name: 'Products', path: '/mywork/products', icon: Package },
        { name: 'Active', path: '/mywork/active', icon: CheckSquare },
      ],
    },
    {
      name: 'WorkOps',
      icon: BarChart3,
      items: [
        { name: 'Daily', path: '/workops/daily', icon: Calendar },
        { name: 'Overall', path: '/workops/overall', icon: BarChart3 },
        { name: 'Boss Briefing', path: '/workops/boss-briefing', icon: Presentation },
        { name: 'Captures', path: '/workops/captures', icon: Camera },
        { name: 'Downstream', path: '/workops/downstream', icon: ArrowDown },
      ],
    },
    {
      name: 'Signals',
      icon: Radio,
      items: [
        { name: 'Signals', path: '/signal', icon: Radio },
        { name: 'Note Lookup', path: '/signal/note', icon: FileText },
        { name: 'Google Scan', path: '/signal/google', icon: Search },
        { name: 'X Feed', path: '/signal/x', icon: Twitter },
        { name: 'Senior Email', path: '/signal/senior', icon: Mail },
        { name: 'Clip Parser', path: '/signal/clip', icon: Newspaper },
      ],
    },
    {
      name: 'My Network',
      icon: Network,
      items: [
        { name: 'Connections', path: '/mynetwork/connections', icon: Network },
        { name: 'Suggestions', path: '/mynetwork/suggestions', icon: UserPlus },
      ],
    },
    {
      name: 'My Career',
      icon: Target,
      items: [
        { name: 'Track', path: '/mycareer/track', icon: Target },
        { name: 'Achievements', path: '/mycareer/achievements', icon: Award },
        { name: 'Reflections', path: '/mycareer/reflections', icon: BookOpen },
      ],
    },
    {
      name: 'Engage',
      icon: MessageSquare,
      items: [
        { name: 'Compose', path: '/engage/compose', icon: MessageSquare },
        { name: 'Templates', path: '/engage/templates', icon: FileText },
        { name: 'Highlights', path: '/engage/highlights', icon: Sparkles },
        { name: 'History', path: '/engage/history', icon: History },
      ],
    },
  ]

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xl font-bold text-gray-900">Work.me</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1 overflow-x-auto flex-1 mx-4">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                pathname === '/dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>

            {navigationGroups.map((group) => {
              const GroupIcon = group.icon
              const hasActiveItem = group.items.some((item) => isActive(item.path))
              
              return (
                <div key={group.name} className="relative">
                  <button
                    onMouseEnter={() => setActiveDropdown(group.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center space-x-1 ${
                      hasActiveItem
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <GroupIcon className="h-4 w-4" />
                    <span>{group.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {activeDropdown === group.name && (
                    <div
                      className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                      onMouseEnter={() => setActiveDropdown(group.name)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {group.items.map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center px-4 py-2 text-sm ${
                              isActive(item.path)
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <ItemIcon className="h-4 w-4 mr-3" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            <Link
              href="/assets"
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap flex items-center space-x-1 ${
                isActive('/assets')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Assets</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
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
                    {userPhoto && (
                      <img
                        src={userPhoto}
                        alt="Profile"
                        className="h-6 w-6 rounded-full object-cover mr-3"
                      />
                    )}
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

