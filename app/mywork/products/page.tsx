'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { getDashboard, refreshDashboard, type WorkProduct } from '@/lib/dashboard.client'
import api from '@/lib/api'
import { Mail, Image, Monitor, FileText, Plus } from 'lucide-react'

const productTypeConfig = {
  email_digest: {
    name: 'Email Digest',
    icon: Mail,
    color: 'blue',
    createPath: '/workforce/enduring/email-digest/new',
    viewPath: (id: string) => `/workforce/enduring/email-digest/${id}`,
  },
  digital_signage: {
    name: 'Digital Signage',
    icon: Monitor,
    color: 'purple',
    createPath: '/mywork/digital-signage/new',
    viewPath: (id: string) => `/mywork/digital-signage/${id}`,
  },
  flyer_poster: {
    name: 'Flyer / Poster',
    icon: Image,
    color: 'green',
    createPath: '/mywork/products/builder/new?type=flyer_poster',
    viewPath: (id: string) => `/mywork/products/${id}`,
  },
  senior_leader_email: {
    name: 'Senior Leader Email',
    icon: FileText,
    color: 'orange',
    createPath: '/mywork/products/builder/new?type=executive_email',
    viewPath: (id: string) => `/mywork/products/${id}`,
  },
}

export default function ProductsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [products, setProducts] = useState<WorkProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      
      setWorkMeId(id)
      loadProducts()
    }
  }, [router])

  async function loadProducts() {
    try {
      setLoading(true)
      
      // Try localStorage first (instant load)
      const dashboard = getDashboard()
      if (dashboard && dashboard.products) {
        setProducts(dashboard.products)
        setLoading(false)
        // Refresh in background
        refreshProductsFromAPI()
        return
      }

      // If not in localStorage, fetch from API
      await refreshProductsFromAPI()
    } catch (error) {
      console.error('Failed to load products:', error)
      setProducts([])
      setLoading(false)
    }
  }

  async function refreshProductsFromAPI() {
    try {
      // Try to refresh dashboard which includes products
      const dashboard = await refreshDashboard()
      if (dashboard && dashboard.products) {
        setProducts(dashboard.products)
        setLoading(false)
        return
      }

      // Fallback: try direct products API
      const response = await api.get('/api/mywork/products/list')
      if (response.data.success && response.data.products) {
        setProducts(response.data.products)
      } else {
        setProducts([])
      }
    } catch (error: any) {
      console.error('Failed to fetch products from API:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Group products by type
  const productsByType = products.reduce((acc, product) => {
    if (!acc[product.type]) {
      acc[product.type] = []
    }
    acc[product.type].push(product)
    return acc
  }, {} as Record<string, WorkProduct[]>)

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/mywork" className="flex items-center space-x-2">
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
              <Link
                href="/mywork"
                className="text-blue-600 hover:text-blue-700 mb-4 inline-block text-sm"
              >
                ← Back to MyWork
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Work Products</h2>
                  <p className="text-gray-600 mt-2">Your work outputs and communication products</p>
                </div>
                {/* Create button removed - use individual product type create buttons below */}
              </div>
            </div>

            {/* Simple Grid of Square Cards */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {products.map(product => {
                  const config = productTypeConfig[product.type as keyof typeof productTypeConfig]
                  const Icon = config?.icon || FileText
                  const color = config?.color || 'gray'
                  
                  return (
                    <Link
                      key={product.id}
                      href={config?.viewPath(product.id) || '#'}
                      className="group aspect-square bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-blue-300 flex flex-col items-center justify-center p-4 text-center"
                    >
                      <Icon className={`h-8 w-8 mb-2 text-${color}-600 group-hover:scale-110 transition-transform`} />
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.title}</h4>
                      <span className="text-xs text-gray-500">{config?.name || product.type}</span>
                    </Link>
                  )
                })}
                
                {/* Create New Card */}
                {Object.entries(productTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <Link
                      key={`create-${type}`}
                      href={config.createPath}
                      className="group aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-4 text-center"
                    >
                      <Icon className="h-8 w-8 mb-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">New {config.name}</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Object.entries(productTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <Link
                      key={`create-${type}`}
                      href={config.createPath}
                      className="group aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-4 text-center"
                    >
                      <Icon className="h-8 w-8 mb-2 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">New {config.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
