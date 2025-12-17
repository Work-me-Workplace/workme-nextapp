'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import api from '@/lib/api'
import { Ship, ArrowLeft, Loader2, Package } from 'lucide-react'

interface PlatformProduct {
  id: string
  name: string
  category: string | null
  platformSeries: string | null
}

export default function CreateUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: platformProductId } = use(params)
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPlatform, setLoadingPlatform] = useState(true)
  const [platform, setPlatform] = useState<PlatformProduct | null>(null)

  // Form state
  const [hullNumber, setHullNumber] = useState('')
  const [name, setName] = useState('')
  const [block, setBlock] = useState('')
  const [shipyard, setShipyard] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')
  const [percentComplete, setPercentComplete] = useState<number | ''>('')
  const [deliveryExpected, setDeliveryExpected] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
      loadPlatform()
    }
  }, [platformProductId, router])

  async function loadPlatform() {
    try {
      setLoadingPlatform(true)
      const response = await api.get(`/api/company/products/platform/${platformProductId}`)
      
      if (response.data.success && response.data.product) {
        setPlatform(response.data.product)
      } else {
        console.error('Failed to load platform:', response.data.error)
        alert('Failed to load platform: ' + (response.data.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to load platform:', error)
      alert('Failed to load platform: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoadingPlatform(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!hullNumber.trim()) {
      alert('Hull Number is required')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/api/company/products/platform/unit/create', {
        platformProductId,
        hullNumber: hullNumber.trim(),
        name: name.trim() || null,
        block: block.trim() || null,
        shipyard: shipyard.trim() || null,
        description: description.trim() || null,
        status: status.trim() || null,
        percentComplete: percentComplete !== '' ? Number(percentComplete) : null,
        deliveryExpected: deliveryExpected || null,
      })

      if (response.data.success) {
        router.push(`/company/products/platform/${platformProductId}`)
      } else {
        alert('Failed to create unit: ' + response.data.error)
      }
    } catch (error: any) {
      console.error('Failed to create unit:', error)
      alert('Failed to create unit: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  if (!workMeId || loadingPlatform) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!platform) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform not found</h2>
          <Link href="/company/products" className="text-blue-600 hover:text-blue-700">
            ← Back to Products
          </Link>
        </div>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/company/products/platform/${platformProductId}`}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {platform.name}
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Platform Unit</h1>
              <p className="text-gray-600 mt-1">For platform: {platform.name}</p>
              {platform.platformSeries && (
                <p className="text-gray-500 text-sm">Series: {platform.platformSeries}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hull Number - Required */}
              <div>
                <label htmlFor="hullNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Hull Number *
                </label>
                <input
                  id="hullNumber"
                  type="text"
                  value={hullNumber}
                  onChange={(e) => setHullNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., SSN 804"
                  required
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Barb"
                />
              </div>

              {/* Block */}
              <div>
                <label htmlFor="block" className="block text-sm font-medium text-gray-700 mb-2">
                  Block
                </label>
                <input
                  id="block"
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Block V"
                />
              </div>

              {/* Shipyard */}
              <div>
                <label htmlFor="shipyard" className="block text-sm font-medium text-gray-700 mb-2">
                  Shipyard
                </label>
                <input
                  id="shipyard"
                  type="text"
                  value={shipyard}
                  onChange={(e) => setShipyard(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., HII Newport News"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <input
                  id="status"
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Under Construction, Keel Laid, Sea Trials"
                />
              </div>

              {/* Percent Complete */}
              <div>
                <label htmlFor="percentComplete" className="block text-sm font-medium text-gray-700 mb-2">
                  Percent Complete
                </label>
                <input
                  id="percentComplete"
                  type="number"
                  min="0"
                  max="100"
                  value={percentComplete}
                  onChange={(e) => setPercentComplete(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0-100"
                />
              </div>

              {/* Delivery Expected */}
              <div>
                <label htmlFor="deliveryExpected" className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Expected
                </label>
                <input
                  id="deliveryExpected"
                  type="date"
                  value={deliveryExpected}
                  onChange={(e) => setDeliveryExpected(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional details about this unit..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Link
                href={`/company/products/platform/${platformProductId}`}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !hullNumber.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Unit'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}





