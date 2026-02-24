'use client'

import { ReactNode } from 'react'
import TopNav from '@/components/layout/TopNav'
import SidebarNav from '@/components/mywork/SidebarNav'

/**
 * Authenticated Route Group Layout
 * 
 * This layout wraps all routes in the (authenticated) route group.
 * Route groups don't affect the URL structure, so /worksupport resolves
 * from app/(authenticated)/worksupport/page.tsx
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

