'use client'

import { ReactNode } from 'react'

/**
 * Authenticated Route Group Layout
 * 
 * This layout wraps all routes in the (authenticated) route group.
 * Route groups don't affect the URL structure, so /worksupport resolves
 * from app/(authenticated)/worksupport/page.tsx
 */
export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

