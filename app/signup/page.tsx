'use client'

import dynamic from 'next/dynamic'

// Dynamically import to prevent SSR
const SignupContent = dynamic(() => import('./SignupContent'), {
  ssr: false,
})

export default function SignupPage() {
  return <SignupContent />
}
