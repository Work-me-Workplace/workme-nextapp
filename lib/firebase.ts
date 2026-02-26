/**
 * Firebase Client SDK - CLIENT-ONLY
 * 
 * ⚠️ Only import this in client components (files with 'use client')
 * Never use in server routes or API handlers
 */

'use client'

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  Auth,
} from 'firebase/auth'
import { firebaseClientApp } from './firebaseClient'

// Only initialize auth in browser. Persistence MUST be set before any auth use.
let auth: Auth | null = null

if (typeof window !== 'undefined' && firebaseClientApp) {
  auth = getAuth(firebaseClientApp)
}

/** Resolves when persistence is set. Subscribe to auth only after this to avoid being kicked out on load. */
const authReady: Promise<Auth | null> =
  auth
    ? setPersistence(auth, browserLocalPersistence)
        .then(() => auth)
        .catch((error) => {
          console.error('[Firebase] Failed to set auth persistence:', error)
          return auth
        })
    : Promise.resolve(null)

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error('Firebase not initialized')
  }
  
  // Sign out first to ensure Google shows account picker
  await auth.signOut()
  
  // Create fresh provider with account selection prompt
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  
  const result = await signInWithPopup(auth, provider)
  const user = result.user

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
  }
}

export async function signOutUser() {
  if (!auth) {
    throw new Error('Firebase not initialized')
  }
  await signOut(auth)
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  if (!auth) {
    throw new Error('Firebase not initialized')
  }
  const result = await createUserWithEmailAndPassword(auth, email, password)
  const user = result.user

  if (displayName) {
    await updateProfile(user, { displayName })
  }

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || displayName,
    photoURL: user.photoURL,
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase not initialized')
  }
  const result = await signInWithEmailAndPassword(auth, email, password)
  const user = result.user

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
  }
}

export function getCurrentUser() {
  return auth?.currentUser || null
}

// Explicit named exports so bundlers (e.g. Vercel) resolve correctly when lib/firebase/ dir exists
export { auth, authReady }
