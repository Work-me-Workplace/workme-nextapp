'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Mail,
  Plus,
  FileText,
  Package,
  ArrowLeft,
} from 'lucide-react'

export default function EmailDigestSidebar() {
  const pathname = usePathname() || ''

  const isActive = (path: string) => {
    if (pathname === path) return true
    if (pathname.startsWith(path + '/')) return true
    return false
  }

  const navigationGroups = [
    {
      name: 'Email Digest',
      items: [
        {
          name: 'All Series',
          path: '/workforce/enduring/email-digest',
          icon: Mail,
        },
        {
          name: 'Create Series',
          path: '/workforce/enduring/email-digest/series/new',
          icon: Plus,
        },
        {
          name: 'Item Catalogue',
          path: '/workforce/enduring/email-digest/items',
          icon: Package,
        },
        {
          name: 'Create Item',
          path: '/workforce/enduring/email-digest/items/new',
          icon: Plus,
        },
      ],
    },
    {
      name: 'Workstuff',
      items: [
        {
          name: 'Add Workstuff',
          path: '/mycompany/workforcestuff/add',
          icon: Plus,
        },
        {
          name: 'View Workstuff',
          path: '/mycompany/workforcestuff',
          icon: FileText,
        },
      ],
    },
    {
      name: 'Navigation',
      items: [
        {
          name: 'Back to MyWork',
          path: '/mywork',
          icon: ArrowLeft,
        },
      ],
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
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
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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

