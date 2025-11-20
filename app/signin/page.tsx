'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import to prevent SSR
const SigninContent = dynamic(() => import('./SigninContent'), {
  ssr: false,
})

export default function SigninPage() {
  return <SigninContent />
}
