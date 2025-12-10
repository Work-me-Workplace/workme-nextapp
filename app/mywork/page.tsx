'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import SidebarNav from '@/components/mywork/SidebarNav'
import { Package, Eye, Calendar, Plus, CheckSquare } from 'lucide-react'

export default function MyWorkHubPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
      } else {
        setWorkMeId(id)
        setLoading(false)
      }
    }
  }, [router])

  if (!workMeId || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hubSections = [
    {
      title: 'Build Products',
      description: 'Create new work products and outputs',
      icon: Plus,
      color: 'blue',
      links: [
        { name: 'Create Product', href: '/mywork/products', description: 'Start building a new product' },
        { name: 'Email Digest', href: '/workforce/enduring/email-digest/new', description: 'Create email digest product' },
        { name: 'Digital Signage', href: '/mywork/digital-signage/new', description: 'Create digital display content' },
      ],
    },
    {
      title: 'View Products',
      description: 'See status and manage your built products',
      icon: Eye,
      color: 'green',
      links: [
        { name: 'All Products', href: '/mywork/products', description: 'View all your work products' },
        { name: 'Active Work', href: '/mywork/active', description: 'See what you\'re currently working on' },
      ],
    },
    {
      title: 'Plan & Organize',
      description: 'Plan future products and organize your work',
      icon: Calendar,
      color: 'purple',
      links: [
        { name: 'Stuff I\'m Working On', href: '/mywork/active', description: 'Track active work items' },
      ],
    },
  ]

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
              <h1 className="text-3xl font-bold text-gray-900">My Work</h1>
              <p className="text-gray-600 mt-2">Your hub for building, viewing, and planning work products</p>
            </div>

            {/* Hub Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hubSections.map((section) => {
                const Icon = section.icon
                const colorClasses = {
                  blue: 'bg-blue-50 border-blue-200 text-blue-700',
                  green: 'bg-green-50 border-green-200 text-green-700',
                  purple: 'bg-purple-50 border-purple-200 text-purple-700',
                }

                return (
                  <div
                    key={section.title}
                    className={`bg-white rounded-lg shadow border-2 ${colorClasses[section.color as keyof typeof colorClasses]} overflow-hidden`}
                  >
                    <div className="p-6 border-b-2 border-gray-200">
                      <div className="flex items-center mb-2">
                        <Icon className={`h-6 w-6 mr-3 text-${section.color}-600`} />
                        <h2 className="text-xl font-bold">{section.title}</h2>
                      </div>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                    <div className="p-6 space-y-3">
                      {section.links.map((link) => (
                        <Link
                          key={link.name}
                          href={link.href}
                          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition"
                        >
                          <h3 className="font-semibold text-gray-900 mb-1">{link.name}</h3>
                          <p className="text-sm text-gray-600">{link.description}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/mywork/products"
                  className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-500"
                >
                  <Package className="h-8 w-8 text-blue-600 mr-4" />
                  <div>
                    <h3 className="font-semibold text-gray-900">View All Products</h3>
                    <p className="text-sm text-gray-600">See all your work products</p>
                  </div>
                </Link>
                <Link
                  href="/mywork/create"
                  className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-green-500"
                >
                  <Plus className="h-8 w-8 text-green-600 mr-4" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Create New Product</h3>
                    <p className="text-sm text-gray-600">Start building something new</p>
                  </div>
                </Link>
                <Link
                  href="/mywork/active"
                  className="flex items-center p-6 bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-purple-500"
                >
                  <CheckSquare className="h-8 w-8 text-purple-600 mr-4" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Active Work</h3>
                    <p className="text-sm text-gray-600">What you're working on</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
