import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import {
  getAuth, signInAnonymously, signInWithPopup, linkWithPopup, linkWithCredential, signInWithCredential,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, EmailAuthProvider, onAuthStateChanged, signOut as fbSignOut,
} from 'firebase/auth'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'

const isNative = Capacitor.isNativePlatform()

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Show diagnostic immediately if any config key is missing
const missingKeys = (Object.keys(firebaseConfig) as (keyof typeof firebaseConfig)[])
  .filter(k => !firebaseConfig[k])

export const cloudEnabled = missingKeys.length === 0

if (!cloudEnabled) {
  // Sin config de Firebase: tratar como no autenticado de inmediato
  setTimeout(() => {
    useAuthStore.getState().setUser(null)
    if (missingKeys.length > 0) {
      useToastStore.getState().add(
        `Firebase desactivado (faltan: ${missingKeys.join(', ')}). La app funciona sin sincronización.`
      )
    }
  }, 0)
}

const app = cloudEnabled ? initializeApp(firebaseConfig) : initializeApp(firebaseConfig, 'stub')

if (cloudEnabled && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  })
}

export const db = getFirestore(app)
export const auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()

let authResolved = false
const authReadyPromise = new Promise<void>(resolve => {
  if (!cloudEnabled) { resolve(); return }
  onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().setUser(user)
    if (!authResolved) { authResolved = true; resolve() }
  })
})

export async function ensureAuth(): Promise<void> {
  if (!cloudEnabled) return
  if (!authResolved) {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase auth timeout — revisá la configuración del proyecto (API key, authDomain, projectId).')), 10_000)
    )
    await Promise.race([authReadyPromise, timeout])
  }
  if (auth.currentUser) return
  try {
    await signInAnonymously(auth)
  } catch (err) {
    console.warn('Anonymous auth unavailable:', (err as { code?: string }).code)
    throw err
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (isNative) {
    // Native: use system Google account picker (no WebView popup)
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    let result
    try {
      result = await FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false })
    } catch (err) {
      console.error('[Google Sign-In] native error:', JSON.stringify(err), err)
      throw err
    }
    const idToken = result.credential?.idToken
    if (!idToken) throw new Error('Google sign-in: no idToken received')
    const credential = GoogleAuthProvider.credential(idToken)
    const current = auth.currentUser
    if (current?.isAnonymous) {
      try {
        await linkWithCredential(current, credential)
      } catch (err: unknown) {
        if ((err as { code?: string }).code === 'auth/credential-already-in-use') {
          await signInWithCredential(auth, credential)
        } else {
          throw err
        }
      }
    } else {
      await signInWithCredential(auth, credential)
    }
    return
  }
  // Web: popup flow
  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      await linkWithPopup(current, googleProvider)
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/credential-already-in-use') {
        await signInWithPopup(auth, googleProvider)
      } else {
        throw err
      }
    }
  } else {
    await signInWithPopup(auth, googleProvider)
  }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      await linkWithCredential(current, EmailAuthProvider.credential(email, password))
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        throw err
      }
    }
  } else {
    await signInWithEmailAndPassword(auth, email, password)
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      await linkWithCredential(current, EmailAuthProvider.credential(email, password))
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        throw new Error('Ya existe una cuenta con ese email. Iniciá sesión en su lugar.')
      }
      throw err
    }
  } else {
    await createUserWithEmailAndPassword(auth, email, password)
  }
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth)
  await signInAnonymously(auth)
}
