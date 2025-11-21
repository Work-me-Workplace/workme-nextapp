/**
 * Firebase Admin SDK - SERVER-ONLY
 * 
 * ⚠️ NEVER import this file in client components
 * Only use in /app/api routes or other server modules
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let adminApp: App | null = null

function getFirebaseAdmin() {
  if (adminApp) {
    return adminApp
  }

  // Check if service account key is provided as JSON string in env
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (!serviceAccountKey) {
    // During build time, env vars might not be available - return a placeholder or throw
    // For build-time, we'll throw a more descriptive error
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      // Not in Vercel build - might be local production build
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not set - Firebase Admin will not be available')
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required. ' +
        'Set it in Vercel environment variables as a JSON string.'
      )
    }
    // During Vercel build, we might not have access to env vars
    // Return a dummy app that will fail gracefully when used
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not set during build')
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required. ' +
      'Set it in Vercel environment variables as a JSON string. ' +
      'The key should be the entire JSON object as a single-line string.'
    )
  }

  let serviceAccount
  try {
    // Try parsing as JSON string (from Vercel env var)
    // Vercel expects the entire JSON object as a single-line string
    serviceAccount = JSON.parse(serviceAccountKey)
  } catch (error) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error)
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON string. ' +
      'Copy the entire serviceAccountKey.json file contents as a single-line string. ' +
      'In Vercel, paste the entire JSON object (with escaped quotes and newlines as needed).'
    )
  }

  // Initialize Firebase Admin if not already initialized
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    })
    console.log('✅ Firebase Admin initialized for project:', serviceAccount.project_id)
  } else {
    adminApp = getApps()[0]
  }

  return adminApp
}

// Lazy exports - only initialize when accessed, not at module load
export function getAdmin() {
  return getFirebaseAdmin()
}

export function getAuthInstance() {
  return getAuth(getFirebaseAdmin())
}

// Lazy getter pattern - only initialize when accessed
let _auth: ReturnType<typeof getAuth> | null = null

export const admin = new Proxy({} as App, {
  get(_target, prop) {
    const app = getFirebaseAdmin()
    return (app as any)[prop]
  }
})

export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_target, prop) {
    if (!_auth) {
      _auth = getAuth(getFirebaseAdmin())
    }
    return (_auth as any)[prop]
  }
})

