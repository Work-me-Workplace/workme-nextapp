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
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required. ' +
      'Set it in Vercel environment variables as a JSON string.'
    )
  }

  let serviceAccount
  try {
    // Try parsing as JSON string (from Vercel env var)
    serviceAccount = JSON.parse(serviceAccountKey)
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON string. ' +
      'Copy the entire serviceAccountKey.json file contents as a string.'
    )
  }

  // Initialize Firebase Admin if not already initialized
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    })
  } else {
    adminApp = getApps()[0]
  }

  return adminApp
}

export const admin = getFirebaseAdmin()
export const auth = getAuth(admin)

