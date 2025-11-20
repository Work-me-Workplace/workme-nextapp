/**
 * Firebase Client SDK - CLIENT-ONLY
 * 
 * ⚠️ Only import this in client components (files with 'use client')
 * Never use in server routes or API handlers
 */

'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
}

// Only initialize in browser
let firebaseClientApp: FirebaseApp | null = null

if (typeof window !== 'undefined') {
  // Initialize only if not already initialized
  firebaseClientApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
}

export { firebaseClientApp }
