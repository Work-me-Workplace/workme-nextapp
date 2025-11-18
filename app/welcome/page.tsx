'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // placeholder: save profile -> redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <h2 className="text-2xl font-semibold mb-4">Welcome — Let’s get set up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Your name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Company</label>
          <input value={company} onChange={e => setCompany(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2">Finish Setup</button>
        </div>
      </form>
    </div>
  )
}
