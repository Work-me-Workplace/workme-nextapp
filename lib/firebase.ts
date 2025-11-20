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

// Only initialize auth in browser
let auth: Auth | null = null
let googleProvider: GoogleAuthProvider | null = null

if (typeof window !== 'undefined' && firebaseClientApp) {
  auth = getAuth(firebaseClientApp)
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Failed to set auth persistence:', error)
  })
  googleProvider = new GoogleAuthProvider()
}

export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error('Firebase not initialized')
  }
  const result = await signInWithPopup(auth, googleProvider)
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

// Export auth for direct access (with null check)
export { auth }
