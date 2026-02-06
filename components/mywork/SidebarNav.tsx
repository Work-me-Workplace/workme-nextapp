'use client'

import Link from 'next/link'
import {
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
  ClipboardList,
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
  Monitor,
  Archive,
  RefreshCw,
  Download,
} from 'lucide-react'

export default function SidebarNav() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  // Company scoped via firebaseid - no params needed
  const buildHref = (path: string) => {
    return path
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path
    if (path === '/mycompany/workforcestuff') return pathname?.startsWith(path)
    if (path === '/mycompany/milestones') return pathname?.startsWith(path)
    if (path === '/mycompany/products') return pathname?.startsWith(path) || pathname?.startsWith('/mycompany/platforms')
    if (path === '/mycompany/platforms/updates') return pathname?.startsWith(path)
    if (path === '/mycompany/articles') return pathname?.startsWith(path)
    if (path === '/mycompany/external-pressures') return pathname?.startsWith(path)
    if (path === '/myorganization/senior-leaders') return pathname?.startsWith(path) || pathname?.startsWith('/mycompany/senior-leaders')
    if (path === '/myorganization/team') return pathname === path || pathname?.startsWith('/mywork/team')
    if (path === '/mycompany/highlights') return pathname?.startsWith(path)
    if (path === '/mywork') return pathname === path || pathname === '/mywork/'
    if (path === '/mywork/memos') return pathname?.startsWith(path) || pathname?.startsWith('/mywork/linkedin')
    if (path === '/mywork/products') return pathname === path || pathname?.startsWith('/mywork/digital-signage') || pathname?.startsWith('/mywork/seniorleader')
    if (path === '/mywork/plans') return pathname?.startsWith(path)
    if (path === '/mywork/active') return pathname === path
    if (path === '/mywork/events') return pathname?.startsWith(path)
    if (path === '/assets/import/dvids') return pathname?.startsWith(path)
    if (path === '/workops/daily') return pathname === path || pathname?.startsWith('/workops/daily')
    if (path === '/workops/overall') return pathname === path || pathname?.startsWith('/workops/overall')
    if (path === '/workops/boss-briefing') return pathname === path || pathname?.startsWith('/workops/boss-briefing')
    if (path === '/workops/captures') return pathname === path || pathname?.startsWith('/workops/captures')
    if (path === '/workops/downstream') return pathname === path || pathname?.startsWith('/workops/downstream')
    if (path === '/workops') return pathname?.startsWith('/workops')
    if (path === '/mycareer') return pathname?.startsWith('/mycareer')
    if (path === '/mynetwork/connections') return pathname === path
    if (path === '/mynetwork/suggestions') return pathname === path
    if (path === '/signal') return pathname?.startsWith(path)
    if (path === '/worksupport') return pathname?.startsWith(path) || pathname?.startsWith('/mywork/support')
    if (path === '/engage') return pathname?.startsWith(path)
    return pathname?.startsWith(path)
  }

  const navigationGroups = [
    {
      name: 'mycareer',
      items: [
        { name: 'My Career', path: '/mycareer/track', icon: Target },
      ],
    },
    {
      name: 'mywork',
      items: [
        { name: 'Work Products', path: '/mywork/products', icon: Package },
        { name: "Stuff I'm Working On", path: '/mywork/active', icon: CheckSquare },
      ],
    },
    {
      name: 'workops',
      items: [
        { name: 'Daily Outlook', path: '/workops/daily', icon: Calendar },
        { name: 'Overall Outlook', path: '/workops/overall', icon: BarChart3 },
      ],
    },
    {
      name: 'mycompany',
      items: [
        { name: 'Workforce Stuff', path: '/mycompany/workforcestuff', icon: Users },
        { name: 'Company Products', path: '/mycompany/products', icon: Package },
      ],
    },
    {
      name: 'signals',
      items: [
        { name: 'Signals', path: '/signal', icon: Radio },
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
                    href={buildHref(item.path)}
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

