'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, Suspense } from 'react'
import SidebarNav from '@/components/mywork/SidebarNav'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { getDashboard, refreshDashboard, type WorkProduct } from '@/lib/dashboard.client'
import api from '@/lib/api'
import { Mail, Image, Monitor, FileText, Eye, MessageSquare, Share2, Loader2, Flag, Ship, Award, Calendar } from 'lucide-react'

/** One item from workforce that can be turned into a sign, flyer, etc. */
export type WorkforceFeedItem = {
  id: string
  type: 'highlight' | 'event' | 'platform_update' | 'milestone'
  title: string
  subtitle?: string | null
  createdAt: string
  raw?: any
}

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
    createPath: '/workforce/enduring/email-digest',
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
  comms_plan: {
    name: 'Comms Plan',
    icon: MessageSquare,
    color: 'green',
    colorClass: 'text-green-600',
    createPath: '/mywork/products/comms-plan/new',
    viewPath: (id: string) => `/mywork/products/comms-plan/${id}`,
  },
}

function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [products, setProducts] = useState<WorkProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'create' | 'review'>('create')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [workforceItems, setWorkforceItems] = useState<WorkforceFeedItem[]>([])
  const [workforceLoading, setWorkforceLoading] = useState(true)
  const [createSignFromId, setCreateSignFromId] = useState<{ type: 'platform_update' | 'milestone'; id: string } | null>(null)

  // Check if we're creating from a source
  const sourceId = searchParams?.get('sourceId')
  const sourceType = searchParams?.get('sourceType')
  const hasSource = !!sourceId && !!sourceType

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }

      setWorkMeId(id)
      loadProducts()
      loadWorkforceFeed()

      // If we have a source, default to create tab
      if (hasSource) {
        setActiveTab('create')
      }
    }
  }, [router, hasSource])

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

  async function loadWorkforceFeed() {
    setWorkforceLoading(true)
    try {
      const dashboard = (await refreshDashboard()) ?? getDashboard() ?? undefined
      const fromHighlights: WorkforceFeedItem[] = (dashboard?.highlights ?? []).slice(0, 20).map((h: any) => ({
        id: h.id,
        type: 'highlight' as const,
        title: h.achievement || h.citationText || 'Employee highlight',
        subtitle: h.employees?.[0]?.fullName ?? undefined,
        createdAt: h.createdAt ?? new Date().toISOString(),
        raw: h,
      }))
      const fromEvents: WorkforceFeedItem[] = (dashboard?.events ?? []).slice(0, 20).map((e: any) => ({
        id: e.id,
        type: 'event' as const,
        title: e.title ?? 'Event',
        subtitle: e.description ?? e.location ?? undefined,
        createdAt: e.createdAt ?? new Date().toISOString(),
        raw: e,
      }))

      let fromUpdates: WorkforceFeedItem[] = []
      let fromMilestones: WorkforceFeedItem[] = []
      try {
        const [updatesRes, milestonesRes] = await Promise.all([
          api.get('/api/company/products/platform/unit/updates/list'),
          api.get('/api/company/milestones/list'),
        ])
        const updates = updatesRes.data?.updates ?? []
        fromUpdates = updates.slice(0, 15).map((u: any) => {
          const unit = u.platformUnit
          const name = unit?.name || unit?.hullNumber || 'Platform'
          return {
            id: u.id,
            type: 'platform_update' as const,
            title: u.statusUpdate ? `${name}: ${u.statusUpdate}` : name,
            subtitle: u.narrativeSummary ?? undefined,
            createdAt: u.updatedAt ?? u.createdAt ?? new Date().toISOString(),
            raw: u,
          }
        })
        const milestones = milestonesRes.data?.milestones ?? []
        fromMilestones = milestones.slice(0, 15).map((m: any) => ({
          id: m.id,
          type: 'milestone' as const,
          title: m.title ?? 'Milestone',
          subtitle: m.description ?? m.platformUnit?.name ?? undefined,
          createdAt: m.date ?? m.createdAt ?? new Date().toISOString(),
          raw: m,
        }))
      } catch {
        // Non-blocking: show highlights + events even if updates/milestones fail
      }

      const merged = [...fromHighlights, ...fromEvents, ...fromUpdates, ...fromMilestones].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setWorkforceItems(merged.slice(0, 25))
    } catch (e) {
      console.error('Failed to load workforce feed:', e)
      setWorkforceItems([])
    } finally {
      setWorkforceLoading(false)
    }
  }

  async function handleCreateSignFromItem(item: WorkforceFeedItem) {
    if (item.type === 'highlight') {
      router.push(`/mywork/digital-signage/builder/new?type=WORKFORCE_ACHIEVEMENT&highlightId=${item.id}`)
      return
    }
    if (item.type === 'event') {
      router.push(`/mywork/digital-signage/builder/new?type=COMPANY_EVENT&source=manual`)
      return
    }
    if (item.type === 'platform_update' || item.type === 'milestone') {
      setCreateSignFromId({ type: item.type, id: item.id })
      try {
        const url =
          item.type === 'platform_update'
            ? `/api/company/products/platform/unit/update/${item.id}/generate-digital-signage`
            : `/api/company/milestones/${item.id}/generate-digital-product`
        const res = await api.post(url, {})
        const signId = res.data?.digitalSign?.id
        if (signId) {
          router.push(`/mywork/digital-signage/${signId}?saved=true`)
          return
        }
      } catch (err: any) {
        console.error('Create sign from item failed:', err)
        alert(err.response?.data?.error || err.message || 'Failed to create sign')
      } finally {
        setCreateSignFromId(null)
      }
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
                  <p className="text-gray-600 mt-2">
                    {hasSource 
                      ? `Create a product from this ${sourceType === 'impact' ? 'impact event' : sourceType}`
                      : 'Your work outputs and communication products'}
                  </p>
                  {hasSource && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Creating from source:</strong> {sourceType === 'impact' ? 'Impact Event' : sourceType}
                      </p>
                    </div>
                  )}
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

            {/* Create New Tab */}
            {activeTab === 'create' && (
              <>
              {/* Latest workforce items – create sign/flyer from hydrated workforce content */}
              <div className="mb-10">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Latest workforce items</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a sign, flyer, or other product from recent workforce content. Pick an item below and choose &quot;Create sign&quot; or &quot;Create flyer&quot;.
                </p>
                {workforceLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading workforce items…</span>
                  </div>
                ) : workforceItems.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                    No workforce items yet. Add highlights, events, or platform updates in your company, or create a product from scratch below.
                  </div>
                ) : (
                  <ul className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                    {workforceItems.map((item) => {
                      const isCreating = createSignFromId?.type === item.type && createSignFromId?.id === item.id
                      const typeLabel = item.type === 'highlight' ? 'Achievement' : item.type === 'event' ? 'Event' : item.type === 'platform_update' ? 'Platform update' : 'Milestone'
                      const TypeIcon = item.type === 'highlight' ? Award : item.type === 'event' ? Calendar : item.type === 'platform_update' ? Ship : Flag
                      return (
                        <li key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <TypeIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5">
                                {typeLabel} · {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCreateSignFromItem(item)}
                              disabled={isCreating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100 disabled:opacity-50"
                            >
                              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Monitor className="h-3.5 w-3.5" />}
                              {isCreating ? 'Creating…' : 'Create sign'}
                            </button>
                            <Link
                              href={`/mywork/products/builder/new?type=flyer_poster&sourceType=${item.type}&sourceId=${item.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                            >
                              <Image className="h-3.5 w-3.5" />
                              Create flyer
                            </Link>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

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
                  // Build create path with source params if available
                  const createPath = hasSource 
                    ? `${config.createPath}${config.createPath.includes('?') ? '&' : '?'}sourceId=${sourceId}&sourceType=${sourceType}`
                    : config.createPath
                  
                  return (
                    <Link
                      key={`create-${type}`}
                      href={createPath}
                      className="group aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-6 text-center"
                    >
                      <Icon className={`h-10 w-10 mb-3 text-gray-400 ${hoverColorClass} transition-colors`} />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">New {config.name}</span>
                    </Link>
                  )
                })}
                
                {/* SharePoint Spec Generator */}
                <Link
                  href="/mywork/products/sharepoint-spec-generator"
                  className="group aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center p-6 text-center"
                >
                  <Share2 className="h-10 w-10 mb-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">SharePoint Spec</span>
                </Link>
              </div>
              </>
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}
