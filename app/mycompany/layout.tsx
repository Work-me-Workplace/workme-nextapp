'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export default function MyCompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const urlCompanyId = searchParams?.get('companyId')
    
    if (!urlCompanyId) {
      // No companyId in URL - check localStorage and redirect if found
      const storedCompanyId = localStorage.getItem('companyId') || localStorage.getItem('companyUnit')
      if (storedCompanyId) {
        const newUrl = `${pathname}?companyId=${encodeURIComponent(storedCompanyId)}`
        router.replace(newUrl)
        return
      }
    } else {
      // companyId in URL - sync to localStorage
      localStorage.setItem('companyId', urlCompanyId)
      localStorage.setItem('companyUnit', urlCompanyId)
    }
  }, [router, pathname, searchParams])

  return <>{children}</>
}

