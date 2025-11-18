import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Work.me',
  description: 'Career growth tracker app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Work.me</h1>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
