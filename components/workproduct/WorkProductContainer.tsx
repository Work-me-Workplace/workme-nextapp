'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, ExternalLink } from 'lucide-react'
import { WORK_PRODUCT_TYPE_OPTIONS } from '@/lib/workproduct.config'

/** Minimal source item shape for "create from this" flows */
export interface WorkProductSource {
  id: string
  type: string
  title: string
  description?: string | null
  summary?: string | null
  [key: string]: unknown
}

export interface WorkProductContainerProps {
  /** The work item (source of truth) – used for create paths and optional summary */
  source: WorkProductSource
  /** Optional company context for links */
  companyId?: string | null
  /** Optional: custom "work stuff" content (e.g. full detail card). If not provided, a compact summary is shown. */
  children?: React.ReactNode
  /** Layout: 'stack' (work above, options below) or 'sidebar' (work left, options right on large screens) */
  layout?: 'stack' | 'sidebar'
  /** Hide the "View related outputs" link */
  hideRelatedLink?: boolean
  className?: string
}

/**
 * WorkProductContainer: shows the work (source of truth) and work product options in one place.
 * Use from workforce stuff detail (primary entry) or from work products page when viewing a source.
 */
export function WorkProductContainer({
  source,
  companyId,
  children,
  layout = 'stack',
  hideRelatedLink = false,
  className = '',
}: WorkProductContainerProps) {
  const router = useRouter()
  const typeLabel = source.type === 'impact' ? 'Impact Event' : source.type.replace(/_/g, ' ')

  const handleProductSelect = (createPath: string) => {
    const url = companyId ? `${createPath}${createPath.includes('?') ? '&' : '?'}companyId=${companyId}` : createPath
    router.push(url)
  }

  const relatedOutputsHref = `/mywork/products?sourceId=${source.id}${source.type ? `&sourceType=${source.type}` : ''}`

  const workStuffSection = children ?? (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded uppercase mb-2">
        {typeLabel}
      </span>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{source.title}</h2>
      {(source.description || source.summary) && (
        <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-4">
          {source.description || source.summary}
        </p>
      )}
    </div>
  )

  const productOptionsSection = (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Create from this</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose a product type to build from this work item. You stay in context—no backtracking.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WORK_PRODUCT_TYPE_OPTIONS.map((productType) => {
          const Icon = productType.icon
          const createPath = productType.createPath(source.id, source.type, companyId)
          return (
            <button
              key={productType.id}
              onClick={() => handleProductSelect(createPath)}
              className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition group"
            >
              <Icon className="h-8 w-8 text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <span className="font-semibold text-gray-900 block">{productType.name}</span>
                <span className="text-sm text-gray-600">{productType.description}</span>
              </div>
            </button>
          )
        })}
      </div>
      {!hideRelatedLink && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href={relatedOutputsHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Package className="h-4 w-4" />
            View related outputs
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )

  if (layout === 'sidebar') {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
        <div className="lg:col-span-2">{workStuffSection}</div>
        <div className="lg:col-span-1">{productOptionsSection}</div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>{workStuffSection}</div>
      <div>{productOptionsSection}</div>
    </div>
  )
}
