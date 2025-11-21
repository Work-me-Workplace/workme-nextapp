'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithGoogle, signInWithEmail } from '@/lib/firebase'
import api from '@/lib/api'

export default function SigninContent() {
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authMethod, setAuthMethod] = useState('google')
  const [emailData, setEmailData] = useState({
    email: '',
    password: '',
  })

  const createOrFindWorkMe = async (payload: any) => {
    const response = await api.post('/api/workme/create', payload)
    const workMe = response.data?.workMe || response.data?.data?.workMe
    if (!workMe) {
      throw new Error('WorkMe creation failed - no workMe returned in response.data')
    }
    return workMe
  }

  const persistSession = async (firebaseUser: any, workMeRecord: any) => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('firebaseId', firebaseUser.uid)
    localStorage.setItem('workMeId', workMeRecord.id)
    localStorage.setItem('email', workMeRecord.email || firebaseUser.email)

    // Get auth from firebase module
    const { auth } = await import('@/lib/firebase')
    if (auth?.currentUser) {
      const idToken = await auth.currentUser.getIdToken()
      localStorage.setItem('firebaseToken', idToken)
    }

    // Also set cookies for server actions to access
    // Set cookie that expires in 7 days
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)
    document.cookie = `workMeId=${workMeRecord.id}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
    document.cookie = `firebaseId=${firebaseUser.uid}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  }

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return

    setIsSigningIn(true)
    try {
      const result = await signInWithGoogle()
      const workMe = await createOrFindWorkMe({
        firebaseId: result.uid,
        email: result.email,
        firstName: result.name?.split(' ')[0] || '',
        lastName: result.name?.split(' ').slice(1).join(' ') || '',
        photoURL: result.photoURL,
      })

      await persistSession(result, workMe)
      router.push('/dashboard')
    } catch (error) {
      console.error('Google sign-in failed:', error)
      alert('Sign-in failed. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSigningIn) return

    setIsSigningIn(true)
    try {
      const result = await signInWithEmail(emailData.email, emailData.password)
      const workMe = await createOrFindWorkMe({
        firebaseId: result.uid,
        email: result.email,
        firstName: result.name?.split(' ')[0] || '',
        lastName: result.name?.split(' ').slice(1).join(' ') || '',
        photoURL: result.photoURL,
      })

      await persistSession(result, workMe)
      router.push('/dashboard')
    } catch (error) {
      console.error('Email sign-in failed:', error)
      alert('Sign-in failed. Please check your credentials.')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center space-y-8 bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="space-y-4">
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center">
            <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Welcome Back!
          </h1>
          <p className="text-white/80 text-lg">
            Sign in to continue your journey
          </p>
        </div>

        <div className="flex bg-white/10 rounded-xl p-1 mb-6">
          <button
            onClick={() => setAuthMethod('google')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              authMethod === 'google' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Google
          </button>
          <button
            onClick={() => setAuthMethod('email')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              authMethod === 'email' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Email
          </button>
        </div>

        {authMethod === 'google' && (
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full bg-white/20 border-2 border-white/30 text-white py-4 px-6 rounded-xl font-semibold hover:bg-white/30 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSigningIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        )}

        {authMethod === 'email' && (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email Address"
              value={emailData.email}
              onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={emailData.password}
              onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50"
            >
              {isSigningIn ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        )}

        <p className="text-white/80 text-sm">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => router.push('/signup')}
            className="text-blue-300 font-semibold hover:underline"
          >
            Sign Up
          </button>
        </p>

        <div className="pt-4 border-t border-white/20">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white transition text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

