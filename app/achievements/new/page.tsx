'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewAchievementPage(){
  const router = useRouter()
  const [title, setTitle] = useState('')

  function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    // TODO: call API to create achievement
    router.push('/achievements')
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-medium mb-4">New Achievement</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Achievement title" className="w-full border rounded px-3 py-2" />
        <div>
          <button className="rounded bg-blue-600 text-white px-4 py-2">Create</button>
        </div>
      </form>
    </div>
  )
}
