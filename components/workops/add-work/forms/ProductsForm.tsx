'use client'

import { useState, useEffect } from 'react'
import { WorkOpsItemType, WorkOpsSource } from '@prisma/client'
import api from '@/lib/api'

interface ProductsFormProps {
  onSubmit: (data: any) => void
  loading: boolean
}

interface Product {
  id: string
  name: string
  category?: string | null
  description?: string | null
}

export default function ProductsForm({ onSubmit, loading }: ProductsFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoadingProducts(true)
      // TODO: Replace with actual API endpoint when CompanyProduct API is built
      // For now, return empty array
      setProducts([])
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    onSubmit({
      title: selectedProduct.name,
      body: selectedProduct.description || null,
      itemType: WorkOpsItemType.external_pressure,
      source: WorkOpsSource.system,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Products
        </label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search products..."
        />
      </div>

      {loadingProducts ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No products available yet.</p>
          <p className="text-sm text-gray-400 mt-2">This feature will be available when Company Products are created.</p>
        </div>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedProduct?.id === product.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    {product.category && (
                      <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {product.category}
                      </span>
                    )}
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                    )}
                  </div>
                  {selectedProduct?.id === product.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={loading || !selectedProduct}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Work Item'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

