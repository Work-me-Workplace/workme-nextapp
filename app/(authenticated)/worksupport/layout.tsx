'use client'

import { ReactNode } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'

/**
 * WorkSupport Layout
 * 
 * Wraps all WorkSupport pages with consistent navigation
 */
export default function WorkSupportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

