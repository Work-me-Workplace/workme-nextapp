'use client'

export default function MyCompanyLayout({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    const urlCompanyId = url.searchParams.get('companyId')
    if (!urlCompanyId) {
      const storedCompanyId = localStorage.getItem('companyId') || localStorage.getItem('companyUnit')
      if (storedCompanyId) {
        url.searchParams.set('companyId', storedCompanyId)
        window.location.replace(url.pathname + url.search)
      }
    } else {
      localStorage.setItem('companyId', urlCompanyId)
      localStorage.setItem('companyUnit', urlCompanyId)
    }
  }

  return <>{children}</>
}

