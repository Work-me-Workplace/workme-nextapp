'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  Target,
  Award,
  BookOpen,
  Network,
  UserPlus,
  Sparkles,
  Calendar,
  FileText,
  Settings,
  TrendingUp,
  CheckSquare,
  Radio,
  Eye,
  ClipboardList,
} from 'lucide-react'

export default function SidebarNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path
    if (path === '/mycompany/profile') return pathname === path
    if (path === '/mycompany/workforcestuff') return pathname?.startsWith(path)
    if (path === '/mycompany/milestones') return pathname?.startsWith(path)
    if (path === '/mycompany/worksignal') return pathname?.startsWith(path)
    if (path === '/mywork/create') return pathname === path
    if (path === '/mywork/fromcompanystuff') return pathname === path
    if (path === '/mywork/active') return pathname === path
    if (path === '/my/outlook') return pathname === path
    if (path === '/my/admin') return pathname === path
    if (path === '/mycareer/track') return pathname === path
    if (path === '/mycareer/achievements') return pathname === path
    if (path === '/mycareer/reflections') return pathname === path
    if (path === '/mynetwork/connections') return pathname === path
    if (path === '/mynetwork/suggestions') return pathname === path
    if (path === '/signal') return pathname?.startsWith(path)
    if (path === '/worksupport') return pathname?.startsWith(path) || pathname?.startsWith('/mywork/support')
    return pathname?.startsWith(path)
  }

  const navigationGroups = [
    {
      name: 'Dashboard',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      name: 'MyCompany',
      items: [
        { name: 'Company Profile', path: '/mycompany/profile', icon: Building2 },
        { name: 'Workforce Stuff', path: '/mycompany/workforcestuff', icon: Users },
        { name: 'Company Milestones', path: '/mycompany/milestones', icon: TrendingUp },
        { name: 'WorkSignal', path: '/mycompany/worksignal', icon: Sparkles },
      ],
    },
    {
      name: 'MyWork',
      items: [
        { name: 'Create Output', path: '/mywork/create', icon: FileText },
        { name: 'Work From Company Stuff', path: '/mywork/fromcompanystuff', icon: Briefcase },
        { name: "Stuff I'm Working On", path: '/mywork/active', icon: CheckSquare },
        { name: 'My Work Outlook', path: '/my/outlook', icon: Eye },
        { name: 'Admin', path: '/my/admin', icon: ClipboardList },
      ],
    },
    {
      name: 'MyCareer',
      items: [
        { name: 'Career Track', path: '/mycareer/track', icon: Target },
        { name: 'Achievements', path: '/mycareer/achievements', icon: Award },
        { name: 'Reflections', path: '/mycareer/reflections', icon: BookOpen },
      ],
    },
    {
      name: 'MyNetwork',
      items: [
        { name: 'Connections', path: '/mynetwork/connections', icon: Network },
        { name: 'Suggested Interactions', path: '/mynetwork/suggestions', icon: UserPlus },
      ],
    },
    {
      name: 'Signals',
      items: [
        { name: 'Signals', path: '/signal', icon: Radio },
      ],
    },
    {
      name: 'Settings',
      items: [
        { name: 'Settings', path: '/setup', icon: Settings },
      ],
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.name}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {group.name}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      active
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

