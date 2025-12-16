'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { getDashboard, refreshDashboard, type WorkProduct } from '@/lib/dashboard.client'
import api from '@/lib/api'
import { Mail, Image, Monitor, FileText, Plus, Eye } from 'lucide-react'

// Normalize text - convert all caps to title case, handle underscores (fallback for edge cases)
function normalizeTitle(text: string | null | undefined): string {
  if (!text) return ''
  
  // If it's all caps or has underscores, normalize it
  const isAllCaps = text === text.toUpperCase() && text !== text.toLowerCase()
  const hasUnderscores = text.includes('_')
  
  if (isAllCaps || hasUnderscores) {
    // Replace underscores with spaces
    let normalized = text.replace(/_/g, ' ')
    
    // Convert to title case (first letter of each word capitalized)
    normalized = normalized.toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return normalized
  }
  
  return text
}

const productTypeConfig = {
  email_digest: {
    name: 'Email Digest',
    icon: Mail,
    color: 'blue',
    colorClass: 'text-blue-600',
    createPath: '/workforce/enduring/email-digest/new',
    viewPath: (id: string) => `/workforce/enduring/email-digest/${id}`,
  },
  digital_signage: {
    name: 'Digital Signage',
    icon: Monitor,
    color: 'purple',
    colorClass: 'text-purple-600',
    createPath: '/mywork/digital-signage/new',
    viewPath: (id: string) => `/mywork/digital-signage/${id}`,
  },
  flyer_poster: {
    name: 'Flyer / Poster',
    icon: Image,
    color: 'green',
    colorClass: 'text-green-600',
    createPath: '/mywork/products/builder/new?type=flyer_poster',
    viewPath: (id: string) => `/mywork/products/${id}`,
  },
  senior_leader_email: {
    name: 'Senior Leader Email',
    icon: FileText,
    color: 'orange',
    colorClass: 'text-orange-600',
    createPath: '/mywork/seniorleader/build',
    viewPath: (id: string) => `/signal/${id}`,
  },
}

export default function ProductsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [products, setProducts] = useState<WorkProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'create' | 'review'>('create')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Work Products</h2>
                  <p className="text-gray-600 mt-2">Your work outputs and communication products</p>
                </div>
              </div>

              {/* Top Navigation Bar */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
                    activeTab === 'create'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create New
                </button>
                <button
                  onClick={() => setActiveTab('review')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
                    activeTab === 'review'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Manage Products
                  {products.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                      {products.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Create New Tab - Only show creation cards */}
            {activeTab === 'create' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {Object.entries(productTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  const colorClass = config.colorClass || 'text-gray-600'
                  // Map color classes to hover states
                  const hoverColorClass = colorClass === 'text-blue-600' ? 'group-hover:text-blue-600' :
                                        colorClass === 'text-purple-600' ? 'group-hover:text-purple-600' :
                                        colorClass === 'text-green-600' ? 'group-hover:text-green-600' :
                                        colorClass === 'text-orange-600' ? 'group-hover:text-orange-600' :
                                        'group-hover:text-blue-600'
                  return (
                    <Link
                      key={`create-${type}`}
                      href={config.createPath}
                      className="group aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-6 text-center"
                    >
                      <Icon className={`h-10 w-10 mb-3 text-gray-400 ${hoverColorClass} transition-colors`} />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">New {config.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* Manage Products Tab - Category cards like create, then list on click */}
            {activeTab === 'review' && (
              <div>
                {!selectedCategory ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Products</h3>
                      <p className="text-sm text-gray-600">Select a category to view and manage products</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {Object.entries(productTypeConfig).map(([type, config]) => {
                        const Icon = config.icon
                        const colorClass = config.colorClass || 'text-gray-600'
                        const typeProducts = productsByType[type] || []
                        const count = typeProducts.length
                        
                        // Map color classes to hover states
                        const hoverColorClass = colorClass === 'text-blue-600' ? 'group-hover:text-blue-600' :
                                              colorClass === 'text-purple-600' ? 'group-hover:text-purple-600' :
                                              colorClass === 'text-green-600' ? 'group-hover:text-green-600' :
                                              colorClass === 'text-orange-600' ? 'group-hover:text-orange-600' :
                                              'group-hover:text-blue-600'
                        
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedCategory(type)}
                            className="group aspect-square bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-6 text-center relative"
                          >
                            <Icon className={`h-10 w-10 mb-3 text-gray-400 ${hoverColorClass} transition-colors`} />
                            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">{config.name}</span>
                            {count > 0 && (
                              <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                {count}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="mb-6 flex items-center">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="mr-4 text-gray-600 hover:text-gray-900"
                      >
                        ← Back
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {productTypeConfig[selectedCategory as keyof typeof productTypeConfig]?.name || selectedCategory}
                        </h3>
                        <p className="text-sm text-gray-600">View, edit, archive, or assign products</p>
                      </div>
                    </div>
                    
                    {(() => {
                      const typeProducts = productsByType[selectedCategory] || []
                      const config = productTypeConfig[selectedCategory as keyof typeof productTypeConfig]
                      const Icon = config?.icon || FileText
                      const colorClass = config?.colorClass || 'text-gray-600'
                      
                      if (typeProducts.length === 0) {
                        return (
                          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                            <Icon className={`h-16 w-16 ${colorClass} mx-auto mb-4`} />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No {config?.name} Products</h3>
                            <p className="text-gray-600">Create your first {config?.name.toLowerCase()} product to get started.</p>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="bg-white rounded-lg border border-gray-200">
                          <div className="divide-y divide-gray-200">
                            {typeProducts.map((product) => {
                              const normalizedTitle = normalizeTitle(product.title)
                              
                              return (
                                <Link
                                  key={product.id}
                                  href={selectedCategory === 'digital_signage' 
                                    ? `/mywork/products/digital_signage/${product.id}/review`
                                    : config?.viewPath(product.id) || '#'}
                                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                                    <Icon className={`h-6 w-6 ${colorClass} flex-shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600">
                                        {normalizedTitle}
                                      </h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Created {new Date(product.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                  <Eye className="h-5 w-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
