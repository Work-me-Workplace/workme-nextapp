'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function MyCompanyLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Skip companyId param handling for workforcestuff routes - they use authenticated user's companyId
    if (pathname?.startsWith('/mycompany/workforcestuff')) {
      return
    }

    const urlCompanyId = searchParams?.get('companyId')
    
    if (!urlCompanyId) {
      // No companyId in URL - check localStorage and redirect if found
      const storedCompanyId = localStorage.getItem('companyId')
      if (storedCompanyId) {
        const newUrl = `${pathname}?companyId=${encodeURIComponent(storedCompanyId)}`
        router.replace(newUrl)
        return
      }
    } else {
      // companyId in URL - sync to localStorage
      localStorage.setItem('companyId', urlCompanyId)
    }
  }, [router, pathname, searchParams])

  return <>{children}</>
}

export default function MyCompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <MyCompanyLayoutContent>{children}</MyCompanyLayoutContent>
    </Suspense>
  )
}

