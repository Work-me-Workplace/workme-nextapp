'use client'

import './globals.css'
import React from 'react'
import { AuthProvider } from '@/lib/providers/AuthProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Work.me</title>
        <link rel="icon" href="/WorkMeIcon.png" type="image/png" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
