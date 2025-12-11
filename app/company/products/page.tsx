'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Package, Ship, Factory, Sparkles, Plus, Cpu, Layers, Network, BarChart3 } from 'lucide-react'

interface PlatformProduct {
  id: string
  name: string
  category: string | null
  platformSeries: string | null
}

interface CapacityProduct {
  id: string
  name: string
  contractorType: string | null
  location: string | null
}

interface InnovationProduct {
  id: string
  name: string
  impactArea: string | null
  maturityLevel: string | null
}

export default function ProductsPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [platformProducts, setPlatformProducts] = useState<PlatformProduct[]>([])
  const [capacityProducts, setCapacityProducts] = useState<CapacityProduct[]>([])
  const [innovationProducts, setInnovationProducts] = useState<InnovationProduct[]>([])
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
      
      const [platformRes, capacityRes, innovationRes] = await Promise.all([
        api.get('/api/company/products/platform/list').catch(() => ({ data: { products: [] } })),
        api.get('/api/company/products/capacity/list').catch(() => ({ data: { products: [] } })),
        api.get('/api/company/products/innovation/list').catch(() => ({ data: { products: [] } }))
      ])

      setPlatformProducts(platformRes.data.products || [])
      setCapacityProducts(capacityRes.data.products || [])
      setInnovationProducts(innovationRes.data.products || [])
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Products</h1>
          <p className="text-gray-600 mt-2">Manage platform products, capacity, and innovation</p>
        </div>

        {/* SECTION A — Platform Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Ship className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Platform Products</h2>
              {platformProducts.length > 0 && (
                <span className="ml-3 text-sm text-gray-500">({platformProducts.length})</span>
              )}
            </div>
            <Link
              href="/company/products/platform/new"
              className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Platform
            </Link>
          </div>

          {platformProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformProducts.map(product => (
                <Link
                  key={product.id}
                  href={`/company/products/platform/${product.id}`}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all border border-gray-200 hover:border-blue-300"
                >
                  <div className="flex items-center mb-3">
                    <Ship className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Platform</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  {product.category && (
                    <p className="text-sm text-gray-600 mb-1">Category: {product.category}</p>
                  )}
                  {product.platformSeries && (
                    <p className="text-sm text-gray-600">Series: {product.platformSeries}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center border-2 border-dashed border-gray-200">
              <Ship className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No platform products yet</p>
              <Link
                href="/company/products/platform/new"
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Create Platform Product
              </Link>
            </div>
          )}
        </section>

        {/* SECTION B — Capacity Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Factory className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Capacity Products</h2>
              {capacityProducts.length > 0 && (
                <span className="ml-3 text-sm text-gray-500">({capacityProducts.length})</span>
              )}
            </div>
            <Link
              href="/company/products/capacity/new"
              className="flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Capacity
            </Link>
          </div>

          {capacityProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capacityProducts.map(product => (
                <Link
                  key={product.id}
                  href={`/company/products/capacity/${product.id}`}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
                >
                  <div className="flex items-center mb-3">
                    <Factory className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Capacity</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  {product.contractorType && (
                    <p className="text-sm text-gray-600 mb-1">Type: {product.contractorType}</p>
                  )}
                  {product.location && (
                    <p className="text-sm text-gray-600">Location: {product.location}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center border-2 border-dashed border-gray-200">
              <Factory className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No capacity products yet</p>
              <Link
                href="/company/products/capacity/new"
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Create Capacity Product
              </Link>
            </div>
          )}
        </section>

        {/* SECTION C — Innovation Products */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Innovation Products</h2>
              {innovationProducts.length > 0 && (
                <span className="ml-3 text-sm text-gray-500">({innovationProducts.length})</span>
              )}
            </div>
            <Link
              href="/company/products/innovation/new"
              className="flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Innovation
            </Link>
          </div>

          {innovationProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {innovationProducts.map(product => (
                <Link
                  key={product.id}
                  href={`/company/products/innovation/${product.id}`}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all border border-gray-200 hover:border-purple-300"
                >
                  <div className="flex items-center mb-3">
                    <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Innovation</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  {product.impactArea && (
                    <p className="text-sm text-gray-600 mb-1">Impact: {product.impactArea}</p>
                  )}
                  {product.maturityLevel && (
                    <p className="text-sm text-gray-600">Maturity: {product.maturityLevel}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center border-2 border-dashed border-gray-200">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No innovation products yet</p>
              <Link
                href="/company/products/innovation/new"
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Create Innovation Product
              </Link>
            </div>
          )}
        </section>

        {/* SECTION D — Future Product Families (static placeholders) */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Future Product Families</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200 opacity-60">
              <div className="flex items-center mb-3">
                <Cpu className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-xs font-medium text-gray-500 uppercase">Coming Soon</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Digital Twin</h3>
              <p className="text-sm text-gray-500">Virtual representations of physical systems</p>
            </div>

            <div className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200 opacity-60">
              <div className="flex items-center mb-3">
                <Layers className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-xs font-medium text-gray-500 uppercase">Coming Soon</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Advanced Materials</h3>
              <p className="text-sm text-gray-500">Next-generation material technologies</p>
            </div>

            <div className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200 opacity-60">
              <div className="flex items-center mb-3">
                <Network className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-xs font-medium text-gray-500 uppercase">Coming Soon</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Autonomous Systems</h3>
              <p className="text-sm text-gray-500">Self-operating systems and robotics</p>
            </div>

            <div className="bg-gray-100 rounded-lg shadow-sm p-6 border border-gray-200 opacity-60">
              <div className="flex items-center mb-3">
                <BarChart3 className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-xs font-medium text-gray-500 uppercase">Coming Soon</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Supply Chain Analytics</h3>
              <p className="text-sm text-gray-500">Data-driven supply chain insights</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
