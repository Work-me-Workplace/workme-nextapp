'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'

export default function SidebarNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === path
    if (path === '/mycompany/workforcestuff') return pathname?.startsWith(path)
    if (path === '/mycompany/milestones') return pathname?.startsWith(path)
    if (path === '/mycompany/products') return pathname?.startsWith(path) || pathname?.startsWith('/mycompany/platforms')
    if (path === '/mycompany/external-pressures') return pathname?.startsWith(path)
    if (path === '/mywork/products') return pathname === path
    if (path === '/mywork/active') return pathname === path
    if (path === '/mywork/team') return pathname === path
    if (path === '/workops/daily') return pathname === path
    if (path === '/workops/overall') return pathname === path
    if (path === '/workops/boss-briefing') return pathname === path
    if (path === '/workops/captures') return pathname === path
    if (path === '/workops/downstream') return pathname === path
    if (path === '/mycareer/track') return pathname === path
    if (path === '/mycareer/achievements') return pathname === path
    if (path === '/mycareer/reflections') return pathname === path
    if (path === '/mynetwork/connections') return pathname === path
    if (path === '/mynetwork/suggestions') return pathname === path
    if (path === '/signal') return pathname?.startsWith(path)
    if (path === '/worksupport') return pathname?.startsWith(path) || pathname?.startsWith('/mywork/support')
    if (path === '/engage') return pathname?.startsWith(path)
    return pathname?.startsWith(path)
  }

  const navigationGroups = [
    {
      name: 'mycompany',
      items: [
        { name: 'Workforce Stuff', path: '/mycompany/workforcestuff', icon: Users },
        { name: 'Company Milestones', path: '/mycompany/milestones', icon: TrendingUp },
        { name: 'Employee Highlights', path: '/mycompany/highlights', icon: Award },
        { name: 'Company Products', path: '/mycompany/products', icon: Package },
        { name: 'External Company Pressures', path: '/mycompany/external-pressures', icon: AlertTriangle },
      ],
    },
    {
      name: 'Mywork',
      items: [
        { name: 'Work Products', path: '/mywork/products', icon: Package },
        { name: "Stuff I'm Working On", path: '/mywork/active', icon: CheckSquare },
        { name: 'Team Members', path: '/mywork/team', icon: Users },
      ],
    },
    {
      name: 'workops',
      items: [
        { name: 'Daily Outlook', path: '/workops/daily', icon: Calendar },
        { name: 'Overall Outlook', path: '/workops/overall', icon: BarChart3 },
        { name: 'Boss Briefing', path: '/workops/boss-briefing', icon: Presentation },
        { name: 'Outlook Captures', path: '/workops/captures', icon: Camera },
        { name: 'Downstream Work Generator', path: '/workops/downstream', icon: ArrowDown },
      ],
    },
    {
      name: 'signals',
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
      name: 'mynetwork',
      items: [
        { name: 'Connections', path: '/mynetwork/connections', icon: Network },
        { name: 'Suggested Interactions', path: '/mynetwork/suggestions', icon: UserPlus },
      ],
    },
    {
      name: 'mycareer',
      items: [
        { name: 'Career Track', path: '/mycareer/track', icon: Target },
        { name: 'Achievements', path: '/mycareer/achievements', icon: Award },
        { name: 'Reflections', path: '/mycareer/reflections', icon: BookOpen },
      ],
    },
    {
      name: 'Engage',
      items: [
        { name: 'Compose', path: '/engage/compose', icon: MessageSquare },
        { name: 'Templates', path: '/engage/templates', icon: FileText },
        { name: 'Highlights', path: '/engage/highlights', icon: Sparkles },
        { name: 'History', path: '/engage/history', icon: History },
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

