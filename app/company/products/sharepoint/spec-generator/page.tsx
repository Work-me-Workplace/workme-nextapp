'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getWorkMeIdFromStorage } from '@/lib/getWorkMeId.client'
import { Share2, ArrowLeft, FileText, Download, Copy } from 'lucide-react'

export default function SharePointSpecGeneratorPage() {
  const router = useRouter()
  const [workMeId, setWorkMeId] = useState<string | null>(null)
  const [specGenerated, setSpecGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    mainHeader: '',
    newsAnnouncement: '',
    buttonText: '',
    destinationPage: '',
    additionalNotes: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getWorkMeIdFromStorage()
      if (!id) {
        router.push('/signin')
        return
      }
      setWorkMeId(id)
    }
  }, [router])

  function generateSpec() {
    if (!formData.mainHeader || !formData.newsAnnouncement || !formData.buttonText || !formData.destinationPage) {
      alert('Please fill in all required fields (Main Header, News Announcement, Button Text, and Destination Page)')
      return
    }
    setSpecGenerated(true)
  }

  function getSpecMarkdown() {
    return `# SharePoint Page Specification

## Overview
This document outlines the specifications for a SharePoint page component.

## Page Structure

### Main Header
**Text:** ${formData.mainHeader}

**Styling:**
- Font size: Large/H1
- Font weight: Bold
- Alignment: Center or Left-aligned (specify preference)
- Color: SharePoint theme color or custom (specify)

---

### News Announcement Section
**Content:** ${formData.newsAnnouncement}

**Styling:**
- Font size: Medium/Regular body text
- Background: Optional highlight box or card
- Padding: Standard SharePoint spacing
- Text alignment: Left-aligned

---

### Call-to-Action Button
**Button Text:** ${formData.buttonText}

**Destination:** ${formData.destinationPage}

**Button Specifications:**
- Style: Primary button (SharePoint default or custom)
- Size: Standard or Large (specify preference)
- Position: Below news announcement section
- Action: Navigate to destination page: \`${formData.destinationPage}\`
- Hover state: Standard SharePoint button hover effect

---

### Additional Notes
${formData.additionalNotes || 'None specified'}

---

## Technical Requirements

### SharePoint Component Type
- **Recommended:** SharePoint Framework (SPFx) Web Part or Modern Page Section
- **Alternative:** SharePoint List/Page with embedded content

### Implementation Notes
1. Header should be prominently displayed at the top of the page
2. News announcement should be clearly readable and accessible
3. Button should be visually distinct and easily clickable
4. Navigation should be seamless to the destination page
5. Ensure responsive design for mobile and tablet views
6. Follow SharePoint accessibility guidelines (WCAG 2.1 AA)

### Content Management
- Consider if content should be editable by site owners
- Determine if this is a one-time setup or dynamic content
- Specify who has permissions to edit this content

---

## Design Mockup Reference
- Header: Top section
- News Announcement: Middle section
- Button: Below announcement, centered or left-aligned

---

## Testing Checklist
- [ ] Header displays correctly on all screen sizes
- [ ] News announcement text is readable and properly formatted
- [ ] Button is clickable and navigates to correct destination
- [ ] Page is accessible (keyboard navigation, screen readers)
- [ ] Responsive design works on mobile devices
- [ ] Content can be edited by authorized users (if applicable)

---

**Generated:** ${new Date().toLocaleString()}
**Spec Version:** 1.0
`
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(getSpecMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadSpec() {
    const blob = new Blob([getSpecMarkdown()], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sharepoint-spec-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!workMeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          href="/company/products/sharepoint/new"
          className="flex items-center text-orange-600 hover:text-orange-700 mb-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to SharePoint Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center mb-6">
            <FileText className="h-8 w-8 text-orange-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">SharePoint Spec Generator</h1>
          </div>

          <p className="text-gray-600 mb-6">
            Fill in the details below to generate a specification document for your SharePoint page.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); generateSpec(); }} className="space-y-6">
            <div>
              <label htmlFor="mainHeader" className="block text-sm font-medium text-gray-700 mb-2">
                Main Header <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="mainHeader"
                required
                value={formData.mainHeader}
                onChange={(e) => setFormData({ ...formData, mainHeader: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Company News & Updates"
              />
            </div>

            <div>
              <label htmlFor="newsAnnouncement" className="block text-sm font-medium text-gray-700 mb-2">
                News Announcement <span className="text-red-500">*</span>
              </label>
              <textarea
                id="newsAnnouncement"
                required
                rows={6}
                value={formData.newsAnnouncement}
                onChange={(e) => setFormData({ ...formData, newsAnnouncement: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter the news announcement text that will appear on the SharePoint page..."
              />
            </div>

            <div>
              <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                Button Text <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="buttonText"
                required
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Learn More, Read Full Article, View Details"
              />
            </div>

            <div>
              <label htmlFor="destinationPage" className="block text-sm font-medium text-gray-700 mb-2">
                Destination Page URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="destinationPage"
                required
                value={formData.destinationPage}
                onChange={(e) => setFormData({ ...formData, destinationPage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://company.sharepoint.com/sites/... or relative path like /pages/news"
              />
            </div>

            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="additionalNotes"
                rows={4}
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Any additional requirements, styling preferences, or notes..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    mainHeader: '',
                    newsAnnouncement: '',
                    buttonText: '',
                    destinationPage: '',
                    additionalNotes: '',
                  })
                  setSpecGenerated(false)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
              >
                Generate Spec
              </button>
            </div>
          </form>
        </div>

        {specGenerated && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Generated Specification</h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={downloadSpec}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {getSpecMarkdown()}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
