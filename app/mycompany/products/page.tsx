'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Ship, Factory, Sparkles } from 'lucide-react'

export default function CompanyProductsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
      setLoading(false)
    }
  }, [router])

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const productTypes = [
    {
      id: 'platform',
      name: 'Platforms',
      description: 'Track major company platforms, capabilities, and external pressures. Manage units, milestones, and updates.',
      icon: Ship,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'hover:border-blue-500',
      path: '/mycompany/platforms',
      available: true,
    },
    {
      id: 'capacity',
      name: 'Capacity',
      description: 'Track production capacity, shipyards, and industrial base capabilities.',
      icon: Factory,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'hover:border-green-500',
      path: '/mycompany/products/capacity',
      available: false,
    },
    {
      id: 'innovation',
      name: 'Innovation',
      description: 'Track innovation products, R&D initiatives, and emerging technologies.',
      icon: Sparkles,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'hover:border-purple-500',
      path: '/mycompany/products/innovation',
      available: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Work.me</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <SidebarNav />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Company Products</h1>
              <p className="text-gray-600 mt-2">Track company products, capabilities, and external pressures</p>
            </div>

            {/* Product Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {productTypes.map((productType) => {
                const Icon = productType.icon
                const CardWrapper = productType.available ? Link : 'div'
                const cardProps = productType.available
                  ? { href: productType.path }
                  : { className: 'cursor-not-allowed opacity-60' }

                return (
                  <CardWrapper
                    key={productType.id}
                    {...cardProps}
                    className={`bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-all border-2 border-transparent ${productType.borderColor} ${!productType.available ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-4 ${productType.bgColor} rounded-lg`}>
                        <Icon className={`h-8 w-8 ${productType.iconColor}`} />
                      </div>
                      {!productType.available && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{productType.name}</h3>
                    <p className="text-sm text-gray-600 mb-6">{productType.description}</p>
                    {productType.available ? (
                      <span className={`${productType.iconColor} font-medium text-sm flex items-center`}>
                        Open {productType.name} →
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium text-sm flex items-center">
                        Coming Soon
                      </span>
                    )}
                  </CardWrapper>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
